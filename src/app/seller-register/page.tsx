"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Upload, Check, X, Eye, EyeOff, User, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Shield, AlertCircle, Loader2, Camera } from "lucide-react";
import { getShiftNiche, SHIFT_NICHES } from "@/lib/shift-work";
import { useMobileCameraCapture } from "@/hooks/useMobileCameraCapture";

type ProviderAccountType = "" | "individual" | "business" | "agency";
type ProviderWorkMode = "none" | "freelance" | "shift" | "both";

type SellerRegistrationForm = {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  postalCode: string;
  birthDate: string;
  serviceCategory: string;
  experience: string;
  description: string;
  workMode: ProviderWorkMode;
  shiftNiche: string;
  shiftRoles: string[];
  shiftSkills: string;
  shiftCertifications: string;
  shiftAvailability: string;
  travelRadiusKm: string;
  preferredHourlyRate: string;
  preferredDayRate: string;
  openToFreelanceJobs: boolean;
  openToUrgentShifts: boolean;
  openToRecurringShifts: boolean;
  siret: string;
  insurance: string;
  documentUrl: string;
  selfieVideoUrl: string;
  insuranceDocumentUrl: string;
  termsAccepted: boolean;
  newsletterAccepted: boolean;
  accountType: ProviderAccountType;
};

export default function SellerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SellerRegistrationForm>({
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    postalCode: "",
    birthDate: "",
    serviceCategory: "",
    experience: "",
    description: "",
    workMode: "both" as ProviderWorkMode,
    shiftNiche: SHIFT_NICHES[0].value,
    shiftRoles: [] as string[],
    shiftSkills: "",
    shiftCertifications: "",
    shiftAvailability: "",
    travelRadiusKm: "10",
    preferredHourlyRate: String(SHIFT_NICHES[0].hourlyAverage),
    preferredDayRate: String(SHIFT_NICHES[0].dayAverage),
    openToFreelanceJobs: true,
    openToUrgentShifts: false,
    openToRecurringShifts: false,
    siret: "",
    insurance: "",
    documentUrl: "",
    selfieVideoUrl: "",
    insuranceDocumentUrl: "",
    termsAccepted: false,
    newsletterAccepted: false,
    accountType: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadedIdFiles, setUploadedIdFiles] = useState<File[]>([]);
  const [uploadedDocumentDataUrl, setUploadedDocumentDataUrl] = useState<string>("");
  const [selfieVideoFile, setSelfieVideoFile] = useState<File | null>(null);
  const [selfieVideoPreviewUrl, setSelfieVideoPreviewUrl] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [workModePreselected, setWorkModePreselected] = useState(false);
  const { isMobileCamera, requestingCameraPermission, cameraError, requestCameraCapture } = useMobileCameraCapture();

  const SERVICE_CATEGORIES = [
    "Cleaning",
    "Handyman", 
    "Gardening",
    "Moving",
    "IT",
    "Home Help",
    "Tutoring",
    "Pet Care",
    "Children",
    "Healthcare",
    "Hospitality",
    "Retail",
    "Logistics",
    "Events",
    "Other"
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const accountTypeParam = params.get("accountType");
    const nextAccountType: ProviderAccountType = accountTypeParam === "business" || accountTypeParam === "agency"
      ? accountTypeParam
      : "individual";
    if (mode === "shift" || mode === "both" || mode === "freelance") {
      const niche = getShiftNiche(params.get("niche"));
      setWorkModePreselected(true);
      setFormData((prev) => ({
        ...prev,
        accountType: nextAccountType,
        workMode: mode,
        serviceCategory: mode === "shift" || mode === "both" ? niche.label : prev.serviceCategory,
        shiftNiche: niche.value,
        preferredHourlyRate: String(niche.hourlyAverage),
        preferredDayRate: String(niche.dayAverage),
      }));
      setCurrentStep(2);
    } else if (accountTypeParam === "business" || accountTypeParam === "agency") {
      setFormData((prev) => ({ ...prev, accountType: accountTypeParam }));
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAccountTypeChange = (accountType: ProviderAccountType) => {
    setFormData((prev) => ({ ...prev, accountType }));
    setErrors((prev) => ({ ...prev, accountType: "" }));
  };

  const handleWorkModeToggle = (mode: "freelance" | "shift") => {
    const niche = getShiftNiche(formData.shiftNiche);
    const hasFreelance = formData.workMode === "freelance" || formData.workMode === "both";
    const hasShift = formData.workMode === "shift" || formData.workMode === "both";
    const nextFreelance = mode === "freelance" ? !hasFreelance : hasFreelance;
    const nextShift = mode === "shift" ? !hasShift : hasShift;
    const nextMode: ProviderWorkMode = nextFreelance && nextShift
      ? "both"
      : nextFreelance
        ? "freelance"
        : nextShift
          ? "shift"
          : "none";
    setFormData((prev) => ({
      ...prev,
      workMode: nextMode,
      serviceCategory: nextShift ? niche.label : prev.serviceCategory,
      openToFreelanceJobs: nextFreelance,
    }));
    setErrors((prev) => ({ ...prev, workMode: "" }));
  };

  const handleShiftNicheChange = (value: string) => {
    const niche = getShiftNiche(value);
    setFormData((prev) => ({
      ...prev,
      shiftNiche: niche.value,
      serviceCategory: niche.label,
      preferredHourlyRate: String(niche.hourlyAverage),
      preferredDayRate: String(niche.dayAverage),
      shiftRoles: prev.shiftRoles.filter((role) => (niche.roles as readonly string[]).includes(role)),
    }));
  };

  const toggleShiftRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      shiftRoles: prev.shiftRoles.includes(role)
        ? prev.shiftRoles.filter((item) => item !== role)
        : [...prev.shiftRoles, role],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const invalidFile = selectedFiles.find((file) => !validTypes.includes(file.type));
    if (invalidFile) {
      setErrors(prev => ({ ...prev, document: "Invalid file format. PDF, JPG, PNG, or WebP required." }));
      return;
    }

    const nextFiles = [...uploadedIdFiles, ...selectedFiles].slice(0, 2);
    setUploadedIdFiles(nextFiles);
    setErrors(prev => ({ ...prev, document: "" }));

    const firstFile = nextFiles[0];
    if (firstFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedDocumentDataUrl(typeof reader.result === "string" ? reader.result : "");
      };
      reader.readAsDataURL(firstFile);
    }
    e.currentTarget.value = "";
  };

  const handleSelfieVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, selfieVideoUrl: "Invalid video format. MP4, WebM or MOV required." }));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, selfieVideoUrl: "Selfie video must be under 100MB." }));
      return;
    }

    if (selfieVideoPreviewUrl) {
      URL.revokeObjectURL(selfieVideoPreviewUrl);
    }

    setSelfieVideoFile(file);
    setSelfieVideoPreviewUrl(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, selfieVideoUrl: "" }));
  };

  useEffect(() => {
    return () => {
      if (selfieVideoPreviewUrl) URL.revokeObjectURL(selfieVideoPreviewUrl);
    };
  }, [selfieVideoPreviewUrl]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.accountType) newErrors.accountType = "Choose whether you are an individual, business, or agency provider";
    } else if (step === 2) {
      if (formData.workMode === "none") newErrors.workMode = "Choose freelance, shifts, or both";
      if ((formData.accountType === "business" || formData.accountType === "agency") && !formData.businessName.trim()) {
        newErrors.businessName = "Business or agency name is required";
      }
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8) newErrors.password = "Minimum 8 characters";
      if (!formData.confirmPassword) newErrors.confirmPassword = "Confirmation is required";
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    } else if (step === 3) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.postalCode.trim()) newErrors.postalCode = "Eircode is required";
      if (!formData.birthDate) newErrors.birthDate = "Date of birth is required";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) newErrors.birthDate = "Use YYYY-MM-DD format";
      if (!formData.serviceCategory) newErrors.serviceCategory = "Service category is required";
      if ((formData.workMode === "shift" || formData.workMode === "both") && formData.shiftRoles.length === 0) {
        newErrors.shiftRoles = "Choose at least one shift role";
      }
      if ((formData.workMode === "shift" || formData.workMode === "both") && !formData.preferredHourlyRate && !formData.preferredDayRate) {
        newErrors.shiftRate = "Set an hourly or day fee";
      }
    } else if (step === 4) {
      if (!formData.siret.trim()) newErrors.siret = "Tax ID or business registration number is required";
      if (uploadedIdFiles.length < 2 && !formData.documentUrl.trim()) newErrors.document = "Upload the front and back of your identity document";
      if (!formData.selfieVideoUrl.trim() && !selfieVideoFile) newErrors.selfieVideoUrl = "Selfie video is required";
      if (formData.insurance === "yes" && !formData.insuranceDocumentUrl.trim()) {
        newErrors.insuranceDocumentUrl = "Insurance document URL is required";
      }
      // Remove terms validation from step 3 - it should be validated in step 4
    } else if (step === 5) {
      if (!formData.termsAccepted) newErrors.terms = "Terms must be accepted";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(5)) {
      setIsLoading(true);
      setSubmitError("");
      
      try {
        const response = await fetch('/api/auth/register-seller', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            businessName: formData.businessName,
            accountType: formData.accountType || "individual",
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            birthDate: formData.birthDate,
            serviceCategory: formData.serviceCategory,
            experience: formData.experience,
            description: formData.description,
            workMode: formData.workMode,
            shiftNiches: formData.workMode === "shift" || formData.workMode === "both" ? [formData.shiftNiche] : [],
            shiftRoles: formData.shiftRoles,
            shiftSkills: formData.shiftSkills.split(",").map((item) => item.trim()).filter(Boolean),
            shiftCertifications: formData.shiftCertifications.split(",").map((item) => item.trim()).filter(Boolean),
            shiftAvailability: { note: formData.shiftAvailability },
            travelRadiusKm: Number(formData.travelRadiusKm),
            preferredHourlyRate: formData.preferredHourlyRate ? Number(formData.preferredHourlyRate) : null,
            preferredDayRate: formData.preferredDayRate ? Number(formData.preferredDayRate) : null,
            openToFreelanceJobs: formData.workMode === "both" || formData.openToFreelanceJobs,
            openToUrgentShifts: formData.openToUrgentShifts,
            openToRecurringShifts: formData.openToRecurringShifts,
            siret: formData.siret,
            insurance: formData.insurance,
            idDocumentUrl: formData.documentUrl,
            selfieVideoUrl: formData.selfieVideoUrl,
            insuranceDocumentUrl: formData.insuranceDocumentUrl,
            termsAccepted: formData.termsAccepted,
            newsletterAccepted: formData.newsletterAccepted
          }),
        });

        const data = await response.json();

        if (response.ok && data.session) {
          // Auto-login: Set the session in Supabase client
          const supabase = createClient();
          
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          for (const [index, idFile] of uploadedIdFiles.entries()) {
            const uploadData = new FormData();
            uploadData.append("file", idFile);
            uploadData.append("image_type", "id_document");
            uploadData.append("title", index === 0 ? "Government ID front" : "Government ID back");
            uploadData.append("description", index === 0 ? "KYC document front side" : "KYC document back side");

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: uploadData,
            });

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json().catch(() => ({}));
              setSubmitError(uploadError.error || "Your account was created, but ID document upload failed. Please upload it from your profile.");
              return;
            }
          }

          if (selfieVideoFile) {
            const uploadData = new FormData();
            uploadData.append("file", selfieVideoFile);
            uploadData.append("image_type", "selfie_video");

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: uploadData,
            });

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json().catch(() => ({}));
              setSubmitError(uploadError.error || "Your account was created, but selfie video upload failed. Please upload it from your profile.");
              return;
            }
          }
          
          // Redirect to seller dashboard (/pro)
          router.push('/pro');
          router.refresh();
        } else if (response.ok) {
          // Fallback if no session (shouldn't happen)
          alert("Registration successful! Please log in.");
          router.push('/login');
        } else {
          // Handle server errors
          setSubmitError(data.error || "Error during registration");
        }
      } catch (error) {
        console.error('Submission error:', error);
        setSubmitError("Server error. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 pt-40 pb-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 5 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2 text-xs text-gray-600">
            <span>Account Type</span>
            <span>Personal Info</span>
            <span>Address & Services</span>
            <span>Documents</span>
            <span>Verification</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Who will provide services?</h2>
              <p className="text-sm leading-6 text-gray-600">
                Choose the provider type that clients should see on your public profile. Businesses that want to hire
                workers or post shifts should still use Register as a Business.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange("individual")}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    formData.accountType === "individual"
                      ? "border-[#006340] bg-[#006340] text-white ring-2 ring-green-100"
                      : "border-gray-200 bg-white text-gray-950 hover:border-[#006340] hover:bg-green-50"
                  }`}
                >
                  <span className="block text-base font-bold">I am an individual provider</span>
                  <span className={`mt-2 block text-sm leading-6 ${formData.accountType === "individual" ? "text-white/80" : "text-gray-600"}`}>
                    I personally want to offer services, quote jobs, or join the shift worker pool.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange("business")}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    formData.accountType === "business"
                      ? "border-red-600 bg-red-600 text-white ring-2 ring-red-100"
                      : "border-gray-200 bg-white text-gray-950 hover:border-red-500 hover:bg-red-50"
                  }`}
                >
                  <span className="block text-base font-bold">Business provider</span>
                  <span className={`mt-2 block text-sm leading-6 ${formData.accountType === "business" ? "text-white/80" : "text-gray-600"}`}>
                    A registered company will provide services to customers under one public business profile.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange("agency")}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    formData.accountType === "agency"
                      ? "border-purple-600 bg-purple-600 text-white ring-2 ring-purple-100"
                      : "border-gray-200 bg-white text-gray-950 hover:border-purple-500 hover:bg-purple-50"
                  }`}
                >
                  <span className="block text-base font-bold">Agency provider</span>
                  <span className={`mt-2 block text-sm leading-6 ${formData.accountType === "agency" ? "text-white/80" : "text-gray-600"}`}>
                    An agency or team will provide services with assigned staff and agency-level documents.
                  </span>
                </button>
              </div>
              {formData.accountType === "business" || formData.accountType === "agency" ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                  This creates a service-provider profile that appears in Find a Provider with a {formData.accountType === "agency" ? "Agency" : "Business"} badge.
                  To post jobs or hire shift workers, use Register as a Business instead.
                </div>
              ) : null}
              {errors.accountType && <p className="text-sm text-red-600">{errors.accountType}</p>}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Info</h2>

              {!workModePreselected ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">How do you want to work on AnyJob?</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      value: "freelance" as const,
                      title: "I want to work freelance",
                      description: "Quote normal AnyJob service requests and set your own project price.",
                    },
                    {
                      value: "shift" as const,
                      title: "I want to work in shifts",
                      description: "Join the business worker pool for day-wage and shift work.",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleWorkModeToggle(option.value)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        (option.value === "freelance" && (formData.workMode === "freelance" || formData.workMode === "both")) ||
                        (option.value === "shift" && (formData.workMode === "shift" || formData.workMode === "both"))
                          ? "border-blue-500 bg-white ring-2 ring-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-950">{option.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-600">{option.description}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-blue-700">
                  You can select freelance, shifts, or both. Both are selected by default so you can receive both kinds of work after screening.
                </p>
                {errors.workMode && <p className="mt-2 text-xs text-red-600">{errors.workMode}</p>}
              </div>
              ) : null}
              
              {(formData.accountType === "business" || formData.accountType === "agency") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.accountType === "agency" ? "Agency Name" : "Business Name"} *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.businessName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={formData.accountType === "agency" ? "AnyJob Services Agency" : "AnyJob Repairs Ltd"}
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.accountType === "individual" ? "First Name *" : "Contact First Name *"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.accountType === "individual" ? "Last Name *" : "Contact Last Name *"}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="john.doe@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="+353 87 123 4567"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Address & Services</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="12 O'Connell Street"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.city ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Dublin"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eircode *
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.postalCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="D02 X285"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.birthDate ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.birthDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Service Category *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      value={formData.serviceCategory}
                      onChange={(e) => handleInputChange("serviceCategory", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${
                        errors.serviceCategory ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a category</option>
                      {SERVICE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.serviceCategory && (
                      <p className="text-red-500 text-xs mt-1">{errors.serviceCategory}</p>
                    )}
                  </div>
                </div>

                {(formData.workMode === "shift" || formData.workMode === "both") && (
                  <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="mb-4 flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-gray-950">Shift worker setup</h3>
                      <p className="text-sm text-gray-600">Choose your niche and set the fee businesses will see when they browse the worker pool.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shift niche *</label>
                        <select
                          value={formData.shiftNiche}
                          onChange={(e) => handleShiftNicheChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {SHIFT_NICHES.map((niche) => (
                            <option key={niche.value} value={niche.value}>{niche.label}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Average: €{getShiftNiche(formData.shiftNiche).hourlyAverage}/hour or €{getShiftNiche(formData.shiftNiche).dayAverage}/day
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Travel radius</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.travelRadiusKm}
                          onChange={(e) => handleInputChange("travelRadiusKm", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred hourly fee</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.preferredHourlyRate}
                          onChange={(e) => handleInputChange("preferredHourlyRate", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred day fee</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.preferredDayRate}
                          onChange={(e) => handleInputChange("preferredDayRate", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">Roles you can perform *</p>
                      <div className="flex flex-wrap gap-2">
                        {getShiftNiche(formData.shiftNiche).roles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleShiftRole(role)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                              formData.shiftRoles.includes(role)
                                ? "border-blue-500 bg-blue-600 text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-blue-200"
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      {errors.shiftRoles && <p className="mt-1 text-xs text-red-500">{errors.shiftRoles}</p>}
                      {errors.shiftRate && <p className="mt-1 text-xs text-red-500">{errors.shiftRate}</p>}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                        <input
                          value={formData.shiftSkills}
                          onChange={(e) => handleInputChange("shiftSkills", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Comma-separated, e.g. patient care, stockroom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Certificates or training</label>
                        <input
                          value={formData.shiftCertifications}
                          onChange={(e) => handleInputChange("shiftCertifications", e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Comma-separated"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Availability note</label>
                      <textarea
                        value={formData.shiftAvailability}
                        onChange={(e) => handleInputChange("shiftAvailability", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Example: weekdays after 6pm, weekends all day"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.openToFreelanceJobs}
                          onChange={(e) => handleInputChange("openToFreelanceJobs", e.target.checked)}
                        />
                        Also show freelance jobs
                      </label>
                      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.openToUrgentShifts}
                          onChange={(e) => handleInputChange("openToUrgentShifts", e.target.checked)}
                        />
                        Same-day shifts
                      </label>
                      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.openToRecurringShifts}
                          onChange={(e) => handleInputChange("openToRecurringShifts", e.target.checked)}
                        />
                        Recurring shifts
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Select your experience</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your experience and services..."
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Documents</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID / business registration number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.siret}
                      onChange={(e) => handleInputChange("siret", e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.siret ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Tax ID or CRO number"
                    maxLength={32}
                  />
                  {errors.siret && (
                    <p className="text-red-500 text-xs mt-1">{errors.siret}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 14 digits without spaces
                </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liability Insurance
                  </label>
                  <select
                    value={formData.insurance}
                    onChange={(e) => handleInputChange("insurance", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">Yes, I am insured</option>
                    <option value="no">No, I do not have insurance</option>
                    <option value="pending">Subscription in progress</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identity document front and back *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload front and back
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PDF, JPG, PNG or WebP. Select two files, or capture each side with camera.
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        multiple
                        onChange={handleFileUpload}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <label htmlFor="file-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        Browse files
                      </label>
	                      {isMobileCamera ? (
	                        <label
	                          onClick={(event) => {
	                            event.preventDefault();
	                            if (requestingCameraPermission) return;
	                            const input = event.currentTarget.querySelector("input") as HTMLInputElement | null;
	                            void requestCameraCapture("environment", () => input?.click());
	                          }}
	                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
	                        >
	                          <Camera className="h-4 w-4" />
	                          {requestingCameraPermission ? "Allow camera..." : "Capture side"}
	                          <input
	                            type="file"
	                            className="sr-only"
	                            accept="image/*"
	                            capture="environment"
	                            onChange={handleFileUpload}
	                          />
	                        </label>
	                      ) : null}
	                    </div>
                    {uploadedIdFiles.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {uploadedIdFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                            <Check className="w-4 h-4" />
                            <span>{index === 0 ? "Front" : "Back"}: {file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedIdFiles((files) => files.filter((_, fileIndex) => fileIndex !== index));
                                setUploadedDocumentDataUrl("");
                              }}
                              className="ml-2 text-green-500 hover:text-green-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                          <Check className="w-4 h-4" />
                          <span>{uploadedIdFiles.length}/2 sides ready</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedIdFiles([]);
                              setUploadedDocumentDataUrl("");
                            }}
                            className="ml-2 text-green-500 hover:text-green-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {errors.document && (
                      <p className="text-red-500 text-xs mt-1">{errors.document}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste an ID document URL
                  </label>
                  <input
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) => handleInputChange("documentUrl", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/id-document.pdf"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Useful when testing without uploading a local file.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selfie video *
                  </label>
                  <div className={`rounded-lg border border-dashed p-4 ${errors.selfieVideoUrl ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"}`}>
                    {selfieVideoPreviewUrl ? (
                      <div className="space-y-3">
                        <video src={selfieVideoPreviewUrl} controls className="max-h-56 w-full rounded-lg bg-black object-contain" />
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{selfieVideoFile?.name}</p>
                            <p className="text-xs text-gray-500">Ready to upload after account creation</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (selfieVideoPreviewUrl) URL.revokeObjectURL(selfieVideoPreviewUrl);
                              setSelfieVideoFile(null);
                              setSelfieVideoPreviewUrl("");
                            }}
                            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-white p-5 text-center hover:bg-blue-50">
                          <Upload className="h-6 w-6 text-blue-600" />
                          <span className="text-sm font-semibold text-gray-900">Upload selfie video</span>
                          <span className="text-xs text-gray-500">MP4, WebM or MOV up to 100MB</span>
                          <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleSelfieVideoUpload} />
                        </label>
	                        {isMobileCamera ? (
	                          <label
	                            onClick={(event) => {
	                              event.preventDefault();
	                              if (requestingCameraPermission) return;
	                              const input = event.currentTarget.querySelector("input") as HTMLInputElement | null;
	                              void requestCameraCapture("user", () => input?.click());
	                            }}
	                            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
	                          >
	                            <Camera className="h-4 w-4" />
	                            {requestingCameraPermission ? "Allow camera..." : "Record with camera"}
	                            <input type="file" accept="video/*" capture="user" className="hidden" onChange={handleSelfieVideoUpload} />
	                          </label>
	                        ) : null}
	                      </div>
	                    )}
	                  </div>
	                  {cameraError ? <p className="mt-2 text-xs font-semibold text-red-600">{cameraError}</p> : null}
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-500">Or paste a selfie video URL</label>
                    <input
                      type="url"
                      value={formData.selfieVideoUrl}
                      onChange={(e) => handleInputChange("selfieVideoUrl", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/selfie-video.mp4"
                    />
                  </div>
                  {errors.selfieVideoUrl && (
                    <p className="text-red-500 text-xs mt-1">{errors.selfieVideoUrl}</p>
                  )}
                </div>

                {formData.insurance === "yes" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance document URL *
                    </label>
                    <input
                      type="url"
                      value={formData.insuranceDocumentUrl}
                      onChange={(e) => handleInputChange("insuranceDocumentUrl", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.insuranceDocumentUrl ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="https://example.com/insurance-document.pdf"
                    />
                    {errors.insuranceDocumentUrl && (
                      <p className="text-red-500 text-xs mt-1">{errors.insuranceDocumentUrl}</p>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Your data is secure</p>
                      <p>
                        Your personal info and documents are encrypted and protected according to GDPR.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Info Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <p className="font-medium">{formData.serviceCategory}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <p className="font-medium">{formData.city}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Tax ID:</span>
                      <p className="font-medium">{formData.siret}</p>
                    </div>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Error</p>
                      <p>{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted}
                    onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                    className={`mt-1 mr-3 ${errors.terms ? "border-red-500" : ""}`}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I accept the{" "}
                    <a href="/terms-of-use" className="text-blue-600 hover:text-blue-800 underline">
                      terms and conditions
                    </a>{" "}
                    and the{" "}
                    <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">
                      privacy policy
                    </a>{" "}
                    *
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-red-500 text-xs">{errors.terms}</p>
                )}

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={formData.newsletterAccepted}
                    onChange={(e) => handleInputChange("newsletterAccepted", e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <label htmlFor="newsletter" className="text-sm text-gray-600">
                    I would like to receive offers and news by email
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Back
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
              >
                {currentStep === 1 && formData.accountType === "business" ? "Business registration" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit registration
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
