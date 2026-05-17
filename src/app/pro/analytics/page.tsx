"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, Star, Calendar, Target } from "lucide-react";

interface AnalyticCard {
  label: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

const analytics: AnalyticCard[] = [
  { label: "Total Jobs", value: "18", change: 12.5, icon: Briefcase, color: "blue" },
  { label: "Completion Rate", value: "94%", change: 5.2, icon: CheckCircle, color: "green" },
  { label: "Avg. Response Time", value: "2.3h", change: -15.3, icon: Clock, color: "purple" },
  { label: "Client Satisfaction", value: "4.8/5", change: 3.1, icon: Star, color: "yellow" },
  { label: "Repeat Clients", value: "42%", change: 8.7, icon: Users, color: "indigo" },
  { label: "Monthly Revenue", value: "£420", change: 18.2, icon: DollarSign, color: "emerald" },
];

const monthlyData = [
  { month: "Oct", jobs: 3, revenue: 280 },
  { month: "Nov", jobs: 5, revenue: 450 },
  { month: "Dec", jobs: 4, revenue: 380 },
  { month: "Jan", jobs: 6, revenue: 520 },
  { month: "Feb", jobs: 7, revenue: 640 },
  { month: "Mar", jobs: 8, revenue: 720 },
];

const categoryBreakdown = [
  { category: "Handyman", jobs: 8, percentage: 44 },
  { category: "Cleaning", jobs: 4, percentage: 22 },
  { category: "Gardening", jobs: 3, percentage: 17 },
  { category: "Moving", jobs: 2, percentage: 11 },
  { category: "Other", jobs: 1, percentage: 6 },
];

import { Briefcase, DollarSign } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <ProviderLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-gray-600">Track your performance and grow your business</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {analytics.map((metric) => {
            const Icon = metric.icon;
            const colorClasses = {
              blue: "bg-blue-50 text-blue-600",
              green: "bg-green-50 text-green-600",
              purple: "bg-purple-50 text-purple-600",
              yellow: "bg-yellow-50 text-yellow-600",
              indigo: "bg-indigo-50 text-indigo-600",
              emerald: "bg-emerald-50 text-emerald-600",
            };

            return (
              <div key={metric.label} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <TrendingUp className="w-4 h-4" />
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            );
          })}
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Trends</h3>
          <div className="grid grid-cols-6 gap-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="text-center">
                <div className="mb-2 flex flex-col items-center gap-1">
                  <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: "120px" }}>
                    <div
                      className="w-full bg-blue-500 rounded-t-lg"
                      style={{
                        height: `${(data.jobs / 10) * 100}%`,
                        marginTop: `${100 - (data.jobs / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-900">{data.jobs}</span>
                </div>
                <p className="text-xs text-gray-500">{data.month}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Jobs by Category</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm text-gray-500">
                      {cat.jobs} jobs ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Complete 10 jobs</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Earn £500</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">£420/£500</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: "84%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Maintain 4.8+ rating</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">✓ Achieved</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Insights & Recommendations</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Your response time has improved by 15% this month. Keep it up!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>You're 2 jobs away from earning the "Top Rated" badge. Complete them to unlock it!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>42% of your clients are repeat customers - excellent retention rate!</span>
            </li>
          </ul>
        </div>
      </div>
    </ProviderLayout>
  );
}
