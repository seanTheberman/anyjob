"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Edit2, ExternalLink, Lock, Mail, Save, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { CATEGORIES } from "@/lib/categories";
import { ProviderMediaManager } from "./ProviderMediaManager";
import { ReceivedReviewsPanel } from "@/components/reviews/ReceivedReviewsPanel";

interface UploadedFile {
  id: string;
  image_url: string;
  public_id: string;
  image_type: string;
  title?: string;
  description?: string;
}

type ProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  serviceCategory: string;
  experienceLevel: string;
  availabilityMode: string;
  availabilityNote: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  hourlyRate: number;
  profileImageUrl: string;
  rating: number;
  totalJobs: number;
  kycStatus: string;
};

type SecurityState = {
  email: string;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
  createdAt: string | null;
};

const emptyProfile: ProfileState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  serviceCategory: "",
  experienceLevel: "",
  availabilityMode: "This week",
  availabilityNote: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Ireland",
  hourlyRate: 0,
  profileImageUrl: "",
  rating: 0,
  totalJobs: 0,
  kycStatus: "not_started",
};

const availabilityOptions = ["Today", "This week", "Weekends", "Evenings", "Remote"];
const experienceOptions = ["New provider", "Beginner", "Intermediate", "Experienced", "Expert", "Agency"];
const ID_FRONT_TITLE = "Government ID front";
const ID_BACK_TITLE = "Government ID back";

function documentSideFiles(files: UploadedFile[], side: "front" | "back"): UploadedFile[] {
  const documents = files.filter((file) => file.image_type === "id_document");
  const titled = documents.filter((file) => (file.title || "").toLowerCase().includes(side));
  if (titled.length) return titled.slice(0, 1);

  if (side === "front") return documents.slice(0, 1);
  const frontId = documentSideFiles(files, "front")[0]?.id;
  return documents.filter((file) => file.id !== frontId).slice(0, 1);
}

function availabilityFields(value: unknown) {
  const data = value && typeof value === "object" ? value as { marketplaceAvailability?: unknown; note?: unknown } : {};
  const marketplaceAvailability = typeof data.marketplaceAvailability === "string" && availabilityOptions.includes(data.marketplaceAvailability)
    ? data.marketplaceAvailability
    : "This week";

  return {
    availabilityMode: marketplaceAvailability,
    availabilityNote: typeof data.note === "string" ? data.note : "",
  };
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileState>(emptyProfile);
  const [kycFiles, setKycFiles] = useState<UploadedFile[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<UploadedFile[]>([]);
  const [portfolioVideo, setPortfolioVideo] = useState<UploadedFile | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await fetch("/api/provider/profile", { cache: "no-store" });
        const payload = response.ok ? await response.json().catch(() => null) : null;
        if (!response.ok || !payload?.user) {
          setSaveError(payload?.error || "Could not load provider profile.");
          return;
        }

        const user = payload.user as { id: string; email?: string };
        const seller = payload.seller;
        const files = (payload.files || []) as UploadedFile[];
        const stats = payload.stats || {};

        setProviderId(user.id);

        if (seller) {
          const availability = availabilityFields(seller.availability);
          const nextProfile = {
            firstName: seller.first_name || "",
            lastName: seller.last_name || "",
            email: seller.email || user.email || "",
            phone: seller.phone || "",
            bio: seller.description || "",
            serviceCategory: seller.service_category || "",
            experienceLevel: seller.experience_level || "",
            availabilityMode: availability.availabilityMode,
            availabilityNote: availability.availabilityNote,
            address: seller.address || "",
            city: seller.city || "",
            postalCode: seller.postal_code || "",
            country: "Ireland",
            hourlyRate: seller.hourly_rate || 0,
            profileImageUrl: seller.profile_image_url || "",
            rating: stats.rating || 0,
            totalJobs: stats.completedJobs || 0,
            kycStatus: seller.verification_status || "not_started",
          };
          setProfile(nextProfile);
          setSavedProfile(nextProfile);
        }

        setKycFiles(files.filter((file) => ["id_document", "selfie_video"].includes(file.image_type)));
        setPortfolioFiles(files.filter((file) => file.image_type === "portfolio"));
        setPortfolioVideo(files.find((file) => file.image_type === "portfolio_video") || null);

        const securityResponse = await fetch("/api/provider/security", { cache: "no-store" });
        const securityPayload = securityResponse.ok ? await securityResponse.json().catch(() => null) : null;
        if (securityPayload?.account) {
          setSecurity({
            email: securityPayload.account.email || user.email || "",
            emailConfirmed: Boolean(securityPayload.account.emailConfirmed),
            lastSignInAt: securityPayload.account.lastSignInAt || null,
            createdAt: securityPayload.account.createdAt || null,
          });
        }
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const normalizedProfile = {
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
      bio: profile.bio.trim(),
      serviceCategory: profile.serviceCategory.trim(),
      experienceLevel: profile.experienceLevel.trim(),
      availabilityMode: availabilityOptions.includes(profile.availabilityMode) ? profile.availabilityMode : "This week",
      availabilityNote: profile.availabilityNote.trim(),
      address: profile.address.trim(),
      city: profile.city.trim(),
      postalCode: profile.postalCode.trim(),
      country: "Ireland",
      hourlyRate: Number.isFinite(profile.hourlyRate) ? profile.hourlyRate : 0,
    };

    if (!normalizedProfile.firstName || !normalizedProfile.lastName || !normalizedProfile.email || !normalizedProfile.phone) {
      setSaving(false);
      setSaveError("First name, last name, email, and phone are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedProfile.email)) {
      setSaving(false);
      setSaveError("Enter a valid email address.");
      return;
    }

    const response = await fetch("/api/provider/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedProfile),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setSaving(false);
      setSaveError(payload?.error || "Profile changes could not be saved.");
      return;
    }

    setProfile(normalizedProfile);
    setSavedProfile(normalizedProfile);
    setIsEditing(false);
    setSaving(false);
    setSaveMessage("Profile changes saved.");
  }

  function cancelEditing() {
    setProfile(savedProfile);
    setIsEditing(false);
    setSaveError(null);
    setSaveMessage(null);
  }

  async function changePassword() {
    setSecuritySaving(true);
    setSecurityError(null);
    setSecurityMessage(null);

    if (newPassword !== confirmPassword) {
      setSecuritySaving(false);
      setSecurityError("New password and confirmation do not match.");
      return;
    }

    const response = await fetch("/api/provider/security", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => null);

    setSecuritySaving(false);
    if (!response.ok) {
      setSecurityError(payload?.error || "Password could not be updated.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSecurityMessage("Password updated successfully.");
  }

  function formatSecurityDate(value: string | null) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your professional profile</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (isEditing) void saveProfile();
                else {
                  setSaveError(null);
                  setSaveMessage(null);
                  setIsEditing(true);
                }
              }}
              disabled={saving || profileLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  {profileLoading ? "Loading..." : "Edit Profile"}
                </>
              )}
            </button>
          </div>
        </div>

        {saveError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {saveError}
          </div>
        ) : null}
        {saveMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        {/* Profile Photo */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-6">
            <ImageUploader
              imageType="profile"
              maxImages={1}
              existingImages={profile.profileImageUrl ? [{
                id: "current-profile",
                image_url: profile.profileImageUrl,
                public_id: "",
                image_type: "profile",
              }] : []}
              onUploadComplete={(img) => setProfile({ ...profile, profileImageUrl: img.image_url })}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500">Provider</p>
              <div className="flex items-center gap-4 mt-2">
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium">{Number(profile.rating).toFixed(1)}</span>
                    <span className="text-gray-500">({profile.totalJobs} jobs)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Reviews</h3>
          <p className="text-sm text-gray-500 mb-4">Your public rating count and score from completed work.</p>
          <ReceivedReviewsPanel mode="summary" allReviewsHref="/pro/reviews" />
        </div>

        {/* Public Profile Fields */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Public Fiverr-style profile</h3>
              <p className="text-sm text-gray-500">These fields power your public provider page, search card, package pricing, and booking profile.</p>
            </div>
            {providerId ? (
              <a
                href={`/providers/${providerId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                View public profile
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="service-category" className="block text-sm font-medium text-gray-700 mb-1">Main service category</label>
              <select
                id="service-category"
                value={profile.serviceCategory}
                onChange={(e) => setProfile({ ...profile, serviceCategory: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="">Choose category</option>
                {CATEGORIES.map((category) => (
                  <option key={category.slug} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience-level" className="block text-sm font-medium text-gray-700 mb-1">Seller experience level</label>
              <select
                id="experience-level"
                value={profile.experienceLevel}
                onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="">Choose experience</option>
                {experienceOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="availability-mode" className="block text-sm font-medium text-gray-700 mb-1">Marketplace availability</label>
              <select
                id="availability-mode"
                value={profile.availabilityMode}
                onChange={(e) => setProfile({ ...profile, availabilityMode: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="starting-rate" className="block text-sm font-medium text-gray-700 mb-1">Starting rate</label>
              <div className="flex rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="flex items-center border-r border-gray-200 px-3 text-sm font-semibold text-gray-500">$</span>
                <input
                  id="starting-rate"
                  type="number"
                  min={0}
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: Number(e.target.value) })}
                  disabled={!isEditing}
                  className="w-full rounded-r-lg px-4 py-2 focus:outline-none disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="availability-note" className="block text-sm font-medium text-gray-700 mb-1">Availability note shown on profile</label>
              <input
                id="availability-note"
                type="text"
                value={profile.availabilityNote}
                onChange={(e) => setProfile({ ...profile, availabilityNote: e.target.value })}
                disabled={!isEditing}
                placeholder="Example: Usually available within 24 hours, evenings preferred"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="public-bio" className="block text-sm font-medium text-gray-700 mb-1">About this gig / public bio</label>
              <textarea
                id="public-bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                rows={5}
                placeholder="Describe what buyers get, your process, what you specialize in, and why they should book you."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* KYC Verification */}
        <div id="kyc" className="bg-white rounded-xl p-6 border border-gray-200 mb-6 scroll-mt-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">KYC Verification</h3>
              <p className="text-sm text-gray-500">Upload the front and back of your government ID, then a short selfie video holding the ID.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {profile.kycStatus.replace("_", " ")}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ImageUploader
              imageType="id_document"
              maxImages={1}
              label="Government ID front"
              uploadTitle={ID_FRONT_TITLE}
              uploadDescription="KYC document front side"
              cameraButtonLabel="Capture front"
              existingImages={documentSideFiles(kycFiles, "front")}
              onUploadComplete={(file) => {
                setKycFiles((prev) => [file, ...prev.filter((item) => item.id !== file.id && (item.image_type !== "id_document" || !(item.title || "").toLowerCase().includes("front")))]);
                setProfile((prev) => ({ ...prev, kycStatus: "pending" }));
              }}
              onDeleteComplete={(imageId) => {
                setKycFiles((prev) => prev.filter((file) => file.id !== imageId));
              }}
            />
            <ImageUploader
              imageType="id_document"
              maxImages={1}
              label="Government ID back"
              uploadTitle={ID_BACK_TITLE}
              uploadDescription="KYC document back side"
              cameraButtonLabel="Capture back"
              existingImages={documentSideFiles(kycFiles, "back")}
              onUploadComplete={(file) => {
                setKycFiles((prev) => [file, ...prev.filter((item) => item.id !== file.id && (item.image_type !== "id_document" || !(item.title || "").toLowerCase().includes("back")))]);
                setProfile((prev) => ({ ...prev, kycStatus: "pending" }));
              }}
              onDeleteComplete={(imageId) => {
                setKycFiles((prev) => prev.filter((file) => file.id !== imageId));
              }}
            />
            <ImageUploader
              imageType="selfie_video"
              maxImages={1}
              label="Selfie video with ID"
              existingImages={kycFiles.filter((file) => file.image_type === "selfie_video").slice(0, 1)}
              onUploadComplete={(file) => {
                setKycFiles((prev) => [file, ...prev.filter((item) => item.image_type !== "selfie_video")]);
                setProfile((prev) => ({ ...prev, kycStatus: "pending" }));
              }}
              onDeleteComplete={(imageId) => {
                setKycFiles((prev) => prev.filter((file) => file.id !== imageId));
              }}
            />
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Marketplace media</h3>
          <p className="text-sm text-gray-500 mb-4">Add up to four photos and one video for your public provider page.</p>
          <ProviderMediaManager
            initialImages={portfolioFiles}
            initialVideo={portfolioVideo}
            onImagesChange={setPortfolioFiles}
            onVideoChange={setPortfolioVideo}
          />
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public contact email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Account Security */}
        <div id="security" className="bg-white rounded-xl p-6 border border-gray-200 mb-6 scroll-mt-24">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Account security</h3>
              <p className="text-sm text-gray-500">View your login email and update your password.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Lock className="h-3.5 w-3.5" />
              Provider login
            </span>
          </div>

          {securityError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {securityError}
            </div>
          ) : null}
          {securityMessage ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {securityMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="h-4 w-4 text-blue-600" />
                Login email
              </div>
              <p className="mt-2 break-words text-sm font-bold text-gray-950">{security?.email || profile.email || "Not available"}</p>
              <p className="mt-1 text-xs text-gray-500">{security?.emailConfirmed ? "Email verified" : "Email verification pending"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Last sign-in</p>
              <p className="mt-2 text-sm font-bold text-gray-950">{formatSecurityDate(security?.lastSignInAt || null)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">Account created</p>
              <p className="mt-2 text-sm font-bold text-gray-950">{formatSecurityDate(security?.createdAt || null)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={changePassword}
              disabled={securitySaving || !currentPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              {securitySaving ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eircode</label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value="Ireland"
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
