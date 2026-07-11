"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, MapPin, CreditCard, Bell, Shield, ChevronDown, BadgeCheck, LockKeyhole, MailCheck, Star } from "lucide-react";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { createClient } from "@/lib/supabase/client";
import { ReceivedReviewsPanel } from "@/components/reviews/ReceivedReviewsPanel";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  city: string;
  postalCode: string;
  kycStatus: string;
}

interface UploadedFile {
  id: string;
  image_url: string;
  public_id: string;
  image_type: string;
  title?: string;
  description?: string;
}

type AccountSection = "personal" | "reviews" | "addresses" | "payment" | "notifications" | "security";
type ProfileTable = "buyers" | "sellers" | "unknown";

const accountSections: Array<{
  id: AccountSection;
  icon: typeof User;
  label: string;
  description: string;
}> = [
  { id: "personal", icon: User, label: "Personal Information", description: "Name, email, phone, and profile photo." },
  { id: "reviews", icon: Star, label: "Reviews", description: "Ratings and feedback other users have left for you." },
  { id: "addresses", icon: MapPin, label: "Addresses", description: "Primary service address and billing area." },
  { id: "payment", icon: CreditCard, label: "Booking Token Payment", description: "How booking token payments work before quote acceptance." },
  { id: "notifications", icon: Bell, label: "Notifications", description: "Where account and job updates are delivered." },
  { id: "security", icon: Shield, label: "Security", description: "Password recovery and account protection." },
];

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

export default function AccountPage() {
  const [openSection, setOpenSection] = useState<AccountSection>("personal");
  const [profileTable, setProfileTable] = useState<ProfileTable>("unknown");
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    city: "",
    postalCode: "",
    kycStatus: "not_started",
  });
  const [kycFiles, setKycFiles] = useState<UploadedFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const openAccountSection = (section: AccountSection) => {
    setOpenSection(section);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", section);
      url.hash = section;
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    const sectionIds = new Set<AccountSection>(accountSections.map((section) => section.id));
    const applyUrlSection = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as AccountSection | null;
      const hash = window.location.hash.replace("#", "") as AccountSection;
      if (tab && sectionIds.has(tab)) {
        setOpenSection(tab);
        return;
      }
      if (hash && sectionIds.has(hash)) {
        setOpenSection(hash);
      }
    };

    applyUrlSection();
    window.addEventListener("hashchange", applyUrlSection);
    window.addEventListener("popstate", applyUrlSection);
    return () => {
      window.removeEventListener("hashchange", applyUrlSection);
      window.removeEventListener("popstate", applyUrlSection);
    };
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try loading from buyers table first, then sellers
      const { data: buyer } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: seller } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", user.id)
        .single();

      const profileData = buyer || seller;
      setProfileTable(buyer ? "buyers" : seller ? "sellers" : "unknown");
      if (profileData) {
        setProfile({
          firstName: profileData.first_name || user.user_metadata?.first_name || "",
          lastName: profileData.last_name || user.user_metadata?.last_name || "",
          email: profileData.email || user.email || "",
          phone: profileData.phone || "",
          avatar: profileData.profile_image_url || "",
          address: profileData.address || "",
          city: profileData.city || "",
          postalCode: profileData.postal_code || "",
          kycStatus: profileData.kyc_status || "not_started",
        });
      } else {
        setProfile({
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          email: user.email || "",
          phone: "",
          avatar: "",
          address: "",
          city: "",
          postalCode: "",
          kycStatus: "not_started",
        });
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setSaveMessage("Please log in again to save your account details.");
      setIsSaving(false);
      return;
    }

    const email = profile.email || user.email || "";
    const payload = {
      email,
      first_name: profile.firstName.trim() || "Buyer",
      last_name: profile.lastName.trim() || "Account",
      phone: profile.phone.trim() || null,
      profile_image_url: profile.avatar || null,
      address: profile.address.trim() || null,
      city: profile.city.trim() || null,
      postal_code: profile.postalCode.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const targetTable = profileTable === "sellers" ? "sellers" : "buyers";
    const query = profileTable === "unknown"
      ? supabase.from(targetTable).upsert({ id: user.id, ...payload })
      : supabase.from(targetTable).update(payload).eq("id", user.id);

    const { error } = await query;

    if (error) {
      setSaveMessage(error.message || "We could not save your account details.");
    } else {
      setProfileTable(targetTable);
      setSaveMessage("Account details saved.");
    }
    setIsSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account</h1>

        {/* Profile Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <ImageUploader
              imageType="profile"
              maxImages={1}
              existingImages={profile.avatar ? [{
                id: "current",
                image_url: profile.avatar,
                public_id: "",
                image_type: "profile",
              }] : []}
              onUploadComplete={(img) => setProfile({ ...profile, avatar: img.image_url })}
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500">{profile.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Member since 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Manage your buyer account details, address, payment guidance, notifications, and security settings below.
          </p>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          {accountSections.map((item, index) => {
            const Icon = item.icon;
            const isOpen = openSection === item.id;
            return (
              <div key={item.id} id={item.id} className={index !== accountSections.length - 1 ? "border-b border-gray-100" : ""}>
                <button
                  type="button"
                  onClick={() => openAccountSection(item.id)}
                  aria-label={item.label}
                  aria-expanded={isOpen}
                  aria-controls={`${item.id}-panel`}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen ? (
                  <div id={`${item.id}-panel`} className="border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                    {item.id === "personal" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                              type="text"
                              value={profile.firstName}
                              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              value={profile.lastName}
                              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={profile.phone}
                              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          {saveMessage ? <p className="text-sm text-gray-600">{saveMessage}</p> : <span />}
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {item.id === "reviews" ? (
                      <ReceivedReviewsPanel mode="summary" allReviewsHref="/dashboard/reviews" />
                    ) : null}

                    {item.id === "addresses" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              value={profile.address}
                              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                              placeholder="Street address"
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={profile.city}
                              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                              placeholder="City"
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Eircode</label>
                            <input
                              type="text"
                              value={profile.postalCode}
                              onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                              placeholder="Eircode"
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          {saveMessage ? <p className="text-sm text-gray-600">{saveMessage}</p> : <p className="text-sm text-gray-500">Exact address stays hidden from providers until the right booking step.</p>}
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? "Saving..." : "Save Address"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {item.id === "payment" ? (
                      <div className="rounded-lg border border-blue-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <CreditCard className="mt-0.5 h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Booking token payments</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Buyers pay the booking token only when accepting a quote. No saved card is required on this account screen.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {item.id === "notifications" ? (
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <MailCheck className="mt-0.5 h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Notification center</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Job updates, quotes, payment notices, and admin messages are sent to {profile.email || "your account email"}.
                            </p>
                            <a href="/dashboard/notifications" className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                              Open notifications
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {item.id === "security" ? (
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <LockKeyhole className="mt-0.5 h-5 w-5 text-gray-700" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Password and account access</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Use password reset if you need to secure or recover this account.
                            </p>
                            <a href="/forgot-password" className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                              Reset password
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* KYC Verification */}
        <div id="kyc" className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6 scroll-mt-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">KYC Verification</h3>
              <p className="text-sm text-gray-500">Required before accepting a provider quote and paying the AnyJob fee.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <BadgeCheck className="h-3.5 w-3.5" />
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
                setProfile((prev) => ({ ...prev, kycStatus: "submitted" }));
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
                setProfile((prev) => ({ ...prev, kycStatus: "submitted" }));
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
                setProfile((prev) => ({ ...prev, kycStatus: "submitted" }));
              }}
              onDeleteComplete={(imageId) => {
                setKycFiles((prev) => prev.filter((file) => file.id !== imageId));
              }}
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
