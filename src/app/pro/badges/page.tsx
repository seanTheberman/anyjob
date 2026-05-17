"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Award, Star, TrendingUp, CheckCircle, Lock, ArrowRight } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  earned: boolean;
  progress?: number;
  requirements: {
    label: string;
    current: number;
    target: number;
    met: boolean;
  }[];
}

const badges: Badge[] = [
  {
    id: "rising-talent",
    name: "Rising Talent",
    description: "New provider showing great potential",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    earned: true,
    requirements: [
      { label: "Complete 5 jobs", current: 8, target: 5, met: true },
      { label: "Maintain 4.5+ rating", current: 4.8, target: 4.5, met: true },
      { label: "Earn £500+", current: 640, target: 500, met: true },
    ],
  },
  {
    id: "top-rated",
    name: "Top Rated",
    description: "Consistently excellent service provider",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    earned: false,
    progress: 75,
    requirements: [
      { label: "Complete 25 jobs", current: 18, target: 25, met: false },
      { label: "Maintain 4.8+ rating", current: 4.8, target: 4.8, met: true },
      { label: "Earn £2,500+", current: 1840, target: 2500, met: false },
      { label: "90%+ response rate", current: 92, target: 90, met: true },
    ],
  },
  {
    id: "anyjob-recommended",
    name: "Anyjob Recommended",
    description: "Elite provider recommended by Anyjob",
    icon: Award,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    earned: false,
    progress: 40,
    requirements: [
      { label: "Complete 50 jobs", current: 18, target: 50, met: false },
      { label: "Maintain 4.9+ rating", current: 4.8, target: 4.9, met: false },
      { label: "Earn £5,000+", current: 1840, target: 5000, met: false },
      { label: "95%+ response rate", current: 92, target: 95, met: false },
      { label: "Zero cancellations", current: 0, target: 0, met: true },
    ],
  },
];

export default function BadgesPage() {
  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Badges & Recognition</h1>
          <p className="text-gray-600">Earn badges by providing excellent service and building your reputation</p>
        </div>

        {/* Current Badge */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Rising Talent</h2>
              <p className="text-blue-100">Your current badge</p>
            </div>
          </div>
          <p className="text-white/90">
            You're off to a great start! Keep up the excellent work to unlock higher tier badges.
          </p>
        </div>

        {/* Badge Progress */}
        <div className="space-y-6">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`bg-white rounded-xl p-6 border-2 ${
                  badge.earned ? "border-green-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${badge.bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 ${badge.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{badge.name}</h3>
                        {badge.earned ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-600">{badge.description}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {!badge.earned && badge.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{badge.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${badge.color.replace("text-", "bg-")}`}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Requirements:</p>
                  {badge.requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {req.met ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                        )}
                        <span className={`text-sm ${req.met ? "text-gray-900" : "text-gray-600"}`}>
                          {req.label}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${req.met ? "text-green-600" : "text-gray-500"}`}>
                        {req.current}/{req.target}
                      </span>
                    </div>
                  ))}
                </div>

                {badge.earned && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Badge earned! This is now displayed on your profile.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Request Badge Section */}
        <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Request Manual Review</h3>
          <p className="text-gray-600 mb-4">
            Think you deserve a badge but haven't received it automatically? Request a manual review from our team.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Request Review
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ProviderLayout>
  );
}
