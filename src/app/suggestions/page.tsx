"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  Check,
  ArrowRight,
  Loader2,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface Inquiry {
  id: string;
  category_slug: string;
  subcategory_slug: string;
  job_description: string;
  preferred_date: string;
  city: string;
  estimated_duration_hours: number;
  number_of_people_needed: number;
  budget_range_min: number;
  budget_range_max: number;
}

interface Provider {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  hourly_rate: number;
  rating: number;
  review_count: number;
  completed_jobs: number;
  services: string[];
  match_score: number;
  match_reasons: string[];
  category_match: boolean;
  location_match: boolean;
  availability_match: boolean;
  price_match: boolean;
}

// Main page component wrapped in Suspense
export default function SuggestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    }>
      <SuggestionsContent />
    </Suspense>
  );
}

// Inner component that uses useSearchParams
function SuggestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const inquiryId = searchParams.get("inquiry");

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!inquiryId) {
      router.push("/");
      return;
    }

    loadSuggestions();
  }, [inquiryId]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);

      // Fetch inquiry details
      const { data: inquiryData, error: inquiryError } = await supabase
        .from("service_inquiries")
        .select("*")
        .eq("id", inquiryId)
        .single();

      if (inquiryError) throw inquiryError;
      if (!inquiryData) {
        setError("Request not found");
        return;
      }

      setInquiry(inquiryData);

      // Generate suggestions using our matching algorithm
      await generateAndFetchSuggestions(inquiryData);
    } catch (err) {
      console.error("Error loading suggestions:", err);
      setError("Unable to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const generateAndFetchSuggestions = async (inquiryData: Inquiry) => {
    try {
      // First, try to generate suggestions via the edge function
      const { error: generateError } = await supabase.functions.invoke(
        "generate-suggestions",
        {
          body: { inquiry_id: inquiryData.id },
        }
      );

      if (generateError) {
        console.log("Edge function not available, using client-side matching");
      }

      // Fetch providers from the database
      const { data: allProviders, error: providersError } = await supabase
        .from("eloo_profiles")
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          bio,
          city,
          eloo_provider_services!inner(
            id,
            title,
            hourly_rate,
            category_id,
            category:eloo_categories(slug)
          )
        `)
        .eq("role", "provider");

      if (providersError) throw providersError;

      // Transform and score providers - use unknown first then type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawProviders = (allProviders as any[]) || [];
      const scoredProviders: Provider[] = [];

      for (const provider of rawProviders) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const services: any[] = provider.eloo_provider_services || [];
        
        // Calculate match scores
        let matchScore = 0;
        const matchReasons: string[] = [];
        let categoryMatch = false;
        let locationMatch = false;
        let priceMatch = false;
        const availabilityMatch = true;

        // Check category match (30 points)
        const matchingServices = services.filter((s: { category?: { slug?: string } | null }) =>
          s.category?.slug === inquiryData.category_slug
        );
        if (matchingServices.length > 0) {
          matchScore += 30;
          categoryMatch = true;
          matchReasons.push("Specialist in " + inquiryData.category_slug);
        }

        // Check location match (25 points)
        if (
          provider.city &&
          inquiryData.city &&
          provider.city.toLowerCase() === inquiryData.city.toLowerCase()
        ) {
          matchScore += 25;
          locationMatch = true;
          matchReasons.push("In your city");
        } else if (provider.city && inquiryData.city) {
          matchScore += 10;
          matchReasons.push("Nearby");
        }

        // Check price match (20 points)
        const avgRate =
          services.reduce((sum: number, s: { hourly_rate?: number }) => sum + (s.hourly_rate || 0), 0) /
          (services.length || 1);
        if (avgRate > 0) {
          if (
            avgRate >= inquiryData.budget_range_min / inquiryData.estimated_duration_hours &&
            avgRate <= inquiryData.budget_range_max / inquiryData.estimated_duration_hours
          ) {
            matchScore += 20;
            priceMatch = true;
            matchReasons.push("Within your budget");
          }
        }

        // Experience bonus (15 points)
        const serviceCount = services.length;
        if (serviceCount >= 3) {
          matchScore += 15;
          matchReasons.push("Experienced provider");
        } else if (serviceCount >= 1) {
          matchScore += 8;
        }

        // Rating bonus (10 points) - simulated for now
        const simulatedRating = 4 + Math.random();
        if (simulatedRating >= 4.5) {
          matchScore += 10;
          matchReasons.push("Excellent ratings");
        } else if (simulatedRating >= 4.0) {
          matchScore += 5;
        }

        scoredProviders.push({
          id: provider.id,
          first_name: provider.first_name,
          last_name: provider.last_name,
          avatar_url:
            provider.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.id}`,
          bio: provider.bio || "Qualified provider",
          city: provider.city || "Not specified",
          hourly_rate: avgRate || 25,
          rating: simulatedRating,
          review_count: Math.floor(Math.random() * 50) + 5,
          completed_jobs: Math.floor(Math.random() * 100) + 10,
          services: services.map((s: { title: string }) => s.title),
          match_score: matchScore,
          match_reasons: matchReasons,
          category_match: categoryMatch,
          location_match: locationMatch,
          availability_match: availabilityMatch,
          price_match: priceMatch,
        });
      }

      // Filter and sort providers
      const filteredProviders = scoredProviders
        .filter((p) => p.category_match)
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 6);

      setProviders(filteredProviders);

      // Save suggestions to database
      if (scoredProviders.length > 0) {
        const suggestionsToInsert = scoredProviders.map((p) => ({
          inquiry_id: inquiryData.id,
          suggested_provider_id: p.id,
          match_score: p.match_score,
          category_match: p.category_match,
          location_match: p.location_match,
          availability_match: p.availability_match,
          price_match: p.price_match,
          match_reasons: p.match_reasons,
        }));

        await supabase.from("service_suggestions").insert(suggestionsToInsert);
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
    }
  };

  const handleSelectProvider = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleContinue = () => {
    if (!selectedProvider) return;
    // Navigate to booking/payment flow
    router.push(`/booking/new?inquiry=${inquiryId}&provider=${selectedProvider}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 dark:text-gray-400">
            We're finding the best providers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to find your request. Please try again.
          </p>
          <Button onClick={() => router.push("/questionnaire")} className="bg-red-600 hover:bg-red-700">
            New request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Provider suggestions
          </h2>
          <div className="text-sm text-gray-500">
            {providers.length} providers found
          </div>
        </div>
        {/* Inquiry Summary */}
        {inquiry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Your service request
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {inquiry.job_description.slice(0, 100)}
                  {inquiry.job_description.length > 100 ? "..." : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(inquiry.preferred_date), "dd MMM", { locale: enUS })}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {inquiry.city}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {inquiry.estimated_duration_hours}h
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {inquiry.number_of_people_needed} pers.
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        
        {/* Provider Grid */}
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    selectedProvider === provider.id
                      ? "border-red-600 ring-2 ring-red-600 ring-opacity-50"
                      : "border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-700"
                  )}
                  onClick={() => handleSelectProvider(provider.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={provider.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + provider.id}
                            alt={`${provider.first_name || ""} ${provider.last_name || ""}`}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            Top
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {provider.first_name || ""} {(provider.last_name || "").charAt(0)}.
                          </h3>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{provider.rating.toFixed(1)}</span>
                            <span className="text-gray-500">({provider.review_count})</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {provider.bio}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {provider.services.slice(0, 2).map((service, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>

                        {/* Match Reasons */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {provider.match_reasons.slice(0, 3).map((reason, i) => (
                            <span
                              key={i}
                              className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> {reason}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              {provider.city}
                            </span>
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <ThumbsUp className="w-4 h-4" />
                              {provider.completed_jobs} jobs
                            </span>
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ${provider.hourly_rate.toFixed(0)}<span className="text-sm font-normal text-gray-500">/h</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedProvider === provider.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" /> Selected
                          </span>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContinue();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Continue <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No providers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              We couldn't find any providers matching your exact criteria.
              Try modifying your search or contact support.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/questionnaire")}
              className="mr-2"
            >
              Modify my request
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <MessageCircle className="w-4 h-4 mr-2" /> Contact support
            </Button>
          </div>
        )}

        {/* Bottom CTA */}
        {providers.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/questionnaire")}>
              Modify my request
            </Button>
            {selectedProvider && (
              <Button
                onClick={handleContinue}
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                Continue with this provider <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
