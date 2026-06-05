"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Edit2, Save, ShieldCheck } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { createClient } from "@/lib/supabase/client";

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
  address: string;
  city: string;
  postalCode: string;
  hourlyRate: number;
  profileImageUrl: string;
  rating: number;
  totalJobs: number;
  kycStatus: string;
};

const emptyProfile: ProfileState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  address: "",
  city: "",
  postalCode: "",
  hourlyRate: 0,
  profileImageUrl: "",
  rating: 0,
  totalJobs: 0,
  kycStatus: "not_started",
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileState>(emptyProfile);
  const [kycFiles, setKycFiles] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: seller } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (seller) {
        const nextProfile = {
          firstName: seller.first_name || "",
          lastName: seller.last_name || "",
          email: seller.email || user.email || "",
          phone: seller.phone || "",
          bio: seller.description || "",
          address: seller.address || "",
          city: seller.city || "",
          postalCode: seller.postal_code || "",
          hourlyRate: seller.hourly_rate || 0,
          profileImageUrl: seller.profile_image_url || "",
          rating: seller.rating || 0,
          totalJobs: seller.total_jobs || 0,
          kycStatus: seller.verification_status || "not_started",
        };
        setProfile(nextProfile);
        setSavedProfile(nextProfile);
      }

      const { data: files } = await supabase
        .from("user_images")
        .select("id,image_url,public_id,image_type,title,description")
        .eq("user_id", user.id)
        .in("image_type", ["id_document", "selfie_video"])
        .order("created_at", { ascending: false });

      setKycFiles(files || []);
    };
    loadProfile();
  }, [supabase]);

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setSaveError("Sign in again before saving profile changes.");
      return;
    }

    const normalizedProfile = {
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: profile.email.trim().toLowerCase(),
      phone: profile.phone.trim(),
      bio: profile.bio.trim(),
      address: profile.address.trim(),
      city: profile.city.trim(),
      postalCode: profile.postalCode.trim(),
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

    const sellerUpdate = {
      first_name: normalizedProfile.firstName,
      last_name: normalizedProfile.lastName,
      email: normalizedProfile.email,
      phone: normalizedProfile.phone,
      description: normalizedProfile.bio || null,
      address: normalizedProfile.address,
      city: normalizedProfile.city,
      postal_code: normalizedProfile.postalCode,
      hourly_rate: normalizedProfile.hourlyRate,
      profile_image_url: normalizedProfile.profileImageUrl || null,
    };

    const profileUpdate = {
      first_name: normalizedProfile.firstName,
      last_name: normalizedProfile.lastName,
      email: normalizedProfile.email,
      phone: normalizedProfile.phone,
      bio: normalizedProfile.bio || null,
      city: normalizedProfile.city,
      postal_code: normalizedProfile.postalCode,
      avatar_url: normalizedProfile.profileImageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const [sellerResult, profileResult] = await Promise.all([
      supabase.from("sellers").update(sellerUpdate).eq("id", user.id),
      supabase.from("eloo_profiles").update(profileUpdate).eq("id", user.id),
    ]);

    if (sellerResult.error || profileResult.error) {
      setSaving(false);
      setSaveError(sellerResult.error?.message || profileResult.error?.message || "Profile changes could not be saved.");
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
              disabled={saving}
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
                  Edit Profile
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

        {/* KYC Verification */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">KYC Verification</h3>
              <p className="text-sm text-gray-500">Upload your government ID and a short selfie video holding the ID.</p>
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
              label="Government ID"
              existingImages={kycFiles.filter((file) => file.image_type === "id_document").slice(0, 1)}
              onUploadComplete={(file) => {
                setKycFiles((prev) => [file, ...prev.filter((item) => item.image_type !== "id_document")]);
                setProfile((prev) => ({ ...prev, kycStatus: "pending" }));
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
            />
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio</h3>
          <p className="text-sm text-gray-500 mb-4">Showcase your best work to attract clients</p>
          <ImageUploader
            imageType="portfolio"
            maxImages={12}
            label=""
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing</h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</label>
            <input
              type="number"
              value={profile.hourlyRate}
              onChange={(e) => setProfile({ ...profile, hourlyRate: Number(e.target.value) })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
