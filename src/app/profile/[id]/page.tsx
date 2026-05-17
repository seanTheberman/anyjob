"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Mail, Star, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_image_url?: string;
  bio?: string;
  city?: string;
  created_at?: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profileId, setProfileId] = useState<string>("");
  
  useEffect(() => {
    params.then(p => setProfileId(p.id));
  }, [params]);
  
    const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${profileId}`);
        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            setProfile(data as Profile);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">This profile could not be found or is not public.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Link
          href="/pro/messages"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32"></div>
          
          <div className="px-6 pb-6">
            {/* Profile Info */}
            <div className="flex items-end -mt-16 mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-600">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-6 mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-gray-600">Member since {profile.created_at ? new Date(profile.created_at).getFullYear() : '2026'}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  Rating
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">127</div>
                <div className="text-sm text-gray-600">Completed Jobs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">On-time Rate</div>
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600">
                {profile.bio || "No bio provided yet."}
              </p>
            </div>

            {/* Location */}
            {profile.city && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}</span>
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>Email available through chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
