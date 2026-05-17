"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, MapPin, CreditCard, Bell, Shield, ChevronRight } from "lucide-react";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  city: string;
  postalCode: string;
}

const menuItems = [
  { icon: User, label: "Personal Information", href: "#personal" },
  { icon: MapPin, label: "Addresses", href: "#addresses" },
  { icon: CreditCard, label: "Booking Token Payment", href: "#payment" },
  { icon: Bell, label: "Notifications", href: "#notifications" },
  { icon: Shield, label: "Security", href: "#security" },
];

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [, setIsEditing] = useState(false);
  const supabase = createClient();

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
        });
      }
    };
    loadProfile();
  }, [supabase]);

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save to API
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account</h1>

        {/* Profile Card */}
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

          {/* Edit Form */}
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              Edit
            </button>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-900">{profile.address}</p>
              <p className="text-gray-500">
                {profile.city}, {profile.postalCode}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
