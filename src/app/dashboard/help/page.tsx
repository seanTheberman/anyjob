"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Search, ChevronRight, Book, Phone, MessageCircle, FileText, Shield, CreditCard, HelpCircle } from "lucide-react";

const faqCategories = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn how to book your first service",
    articles: 12,
  },
  {
    icon: CreditCard,
    title: "Booking Tokens & Billing",
    description: "Booking token, onsite balance, refunds, and billing questions",
    articles: 8,
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Our safety measures and insurance coverage",
    articles: 6,
  },
  {
    icon: FileText,
    title: "Account & Settings",
    description: "Manage your account and preferences",
    articles: 10,
  },
];

const popularQuestions = [
  "How do I book a service?",
  "How does the booking token work?",
  "How do I cancel or reschedule a booking?",
  "What happens if my provider doesn't show up?",
  "How do I contact my provider?",
  "Are the providers verified?",
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Help Center</h1>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Chat with us</h3>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>
            </div>
            <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Start Chat
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Call us</h3>
                <p className="text-sm text-gray-500">Mon-Fri, 9am-6pm</p>
              </div>
            </div>
            <button className="w-full py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              +44 800 123 4567
            </button>
          </div>
        </div>

        {/* FAQ Categories */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Browse by Topic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.title}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{category.articles} articles</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Popular Questions */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Questions</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {popularQuestions.map((question, index) => (
            <button
              key={index}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${
                index !== popularQuestions.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{question}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
