"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle, ShieldCheck, Star, TrendingUp } from "lucide-react";

import { ProviderLayout } from "@/components/provider/ProviderLayout";

type ProviderBadge = {
  id: string;
  awarded_at: string | null;
  awarded_reason: string | null;
  badge?: {
    name: string | null;
    description: string | null;
    icon: string | null;
    color: string | null;
  } | null;
};

const iconMap = {
  Award,
  ShieldCheck,
  Star,
  TrendingUp,
};

function badgeIcon(name?: string | null) {
  return iconMap[name as keyof typeof iconMap] || Award;
}

function colorClasses(color?: string | null) {
  if (color === "emerald") return "bg-emerald-50 text-emerald-600 border-emerald-200";
  if (color === "blue") return "bg-blue-50 text-blue-600 border-blue-200";
  if (color === "amber") return "bg-amber-50 text-amber-600 border-amber-200";
  if (color === "purple") return "bg-purple-50 text-purple-600 border-purple-200";
  return "bg-red-50 text-red-600 border-red-200";
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<ProviderBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      const response = await fetch("/api/provider/dashboard-data", { cache: "no-store" });
      const payload = response.ok ? await response.json().catch(() => null) : null;
      const data = payload?.badges || [];

      setBadges(((data || []) as unknown as Array<ProviderBadge & { badge?: ProviderBadge["badge"] | ProviderBadge["badge"][] }>).map((badge) => ({
        ...badge,
        badge: firstRelation(badge.badge),
      })));
      setLoading(false);
    };

    void loadBadges();
  }, []);

  const currentBadge = badges[0];
  const CurrentIcon = badgeIcon(currentBadge?.badge?.icon);

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Badges & Recognition</h1>
          <p className="text-gray-600">Badges awarded from Supabase badge definitions and provider awards.</p>
        </div>

        {currentBadge ? (
          <div className="rounded-xl border border-blue-200 bg-blue-600 p-6 mb-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CurrentIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">{currentBadge.badge?.name || "Badge"}</h2>
                <p className="text-blue-100">Latest awarded badge</p>
              </div>
            </div>
            <p className="text-white/90">{currentBadge.badge?.description || currentBadge.awarded_reason || "Awarded from Supabase."}</p>
          </div>
        ) : null}

        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-500">Loading badges...</div>
          ) : badges.length ? badges.map((badge) => {
            const Icon = badgeIcon(badge.badge?.icon);
            return (
              <div key={badge.id} className={`bg-white rounded-xl p-6 border ${colorClasses(badge.badge?.color)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{badge.badge?.name || "Badge"}</h3>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-gray-600">{badge.badge?.description || badge.awarded_reason || "Awarded badge."}</p>
                      <p className="mt-2 text-xs font-medium text-gray-500">
                        {badge.awarded_at ? `Awarded ${new Date(badge.awarded_at).toLocaleDateString()}` : "Award date not set"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-sm text-gray-500">No Supabase badges awarded yet.</div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
