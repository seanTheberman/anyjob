"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoryTabs } from "@/components/dashboard/CategoryTabs";
import { PromoBanner } from "@/components/dashboard/PromoBanner";
import { ServiceSection, LargeServiceCard } from "@/components/dashboard/ServiceCards";
import { ProviderSection } from "@/components/dashboard/ProviderCards";
import { CATEGORIES } from "@/lib/categories";

// Mock data for services
const popularServices = [
  {
    id: "1",
    title: "Moving help",
    description: "Get help with moving furniture and boxes",
    image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
  {
    id: "2",
    title: "Installation of lamps and fixtures",
    description: "Professional light fixture installation",
    image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    id: "3",
    title: "Furniture assembly",
    description: "Assembly of IKEA and other furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    id: "4",
    title: "House cleaning",
    description: "Professional home cleaning services",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    href: "/questionnaire?category=menage&from_dashboard=true",
  },
];

const diyServices = [
  {
    id: "5",
    title: "Interior Painting",
    description: "Professional painting services for your home",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    id: "6",
    title: "IKEA furniture assembly",
    description: "Expert IKEA furniture assembly",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    id: "7",
    title: "Furniture assembly",
    description: "All types of furniture assembly",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    id: "8",
    title: "Other installation and fixing",
    description: "General handyman services",
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=300&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
];

const movingServices = [
  {
    id: "9",
    title: "Moving help",
    description: "Professional moving assistance",
    image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=400&h=300&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
  {
    id: "10",
    title: "Moving appliances",
    description: "Safe appliance moving services",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
  {
    id: "11",
    title: "Get rid of bulky items",
    description: "Furniture and bulky item removal",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
  {
    id: "12",
    title: "Moving a piece of furniture",
    description: "Single item moving service",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
];

const gardeningServices = [
  {
    id: "13",
    title: "Mowing the lawn",
    description: "Professional lawn mowing service",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    href: "/questionnaire?category=jardinage&from_dashboard=true",
  },
  {
    id: "14",
    title: "Hedge trimming",
    description: "Expert hedge and bush trimming",
    image: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=400&h=300&fit=crop",
    href: "/questionnaire?category=jardinage&from_dashboard=true",
  },
  {
    id: "15",
    title: "Brushing / Weeding",
    description: "Garden clearing and weeding",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop",
    href: "/questionnaire?category=jardinage&from_dashboard=true",
  },
  {
    id: "16",
    title: "Weed control",
    description: "Professional weed management",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    href: "/questionnaire?category=jardinage&from_dashboard=true",
  },
];

const saveTimeServices = [
  {
    id: "17",
    title: "House cleaning",
    description: "Complete home cleaning service",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    href: "/questionnaire?category=menage&from_dashboard=true",
  },
  {
    id: "18",
    title: "Mowing the lawn",
    description: "Garden maintenance service",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    href: "/questionnaire?category=jardinage&from_dashboard=true",
  },
  {
    id: "19",
    title: "Ironing",
    description: "Professional ironing service",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    href: "/questionnaire?category=menage&from_dashboard=true",
  },
  {
    id: "20",
    title: "Window cleaning",
    description: "Crystal clear window cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    href: "/questionnaire?category=menage&from_dashboard=true",
  },
];

type RealProvider = {
  id: string;
  slug: string;
  name: string;
  category: string;
  rate: number;
  image?: string | null;
  isNew?: boolean;
  tags: string[];
};

const practicalCategories = [
  {
    title: "DIY",
    description: "Particularly useful for fitting out and repairing things that get damaged over time.",
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&h=400&fit=crop",
    href: "/questionnaire?category=bricolage&from_dashboard=true",
  },
  {
    title: "Moving",
    description: "Ease the move and relieve emotional stress for family members.",
    image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&h=400&fit=crop",
    href: "/questionnaire?category=demenagement&from_dashboard=true",
  },
];

const childrenCategories = [
  {
    title: "Childcare",
    description: "Support for parents and children's educational and emotional development.",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=400&fit=crop",
    href: "/questionnaire?category=enfants&from_dashboard=true",
  },
  {
    title: "Tutoring",
    description: "Providing beneficial support for children to help them cope with difficulties or excel.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop",
    href: "/questionnaire?category=cours-particuliers&from_dashboard=true",
  },
];

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState("for-you");
  const [providers, setProviders] = useState<RealProvider[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/providers")
      .then((response) => (response.ok ? response.json() : { providers: [] }))
      .then((data) => {
        if (isMounted) setProviders(Array.isArray(data.providers) ? data.providers : []);
      })
      .catch(() => {
        if (isMounted) setProviders([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter services and content based on active category
  const filteredContent = useMemo(() => {
    if (activeCategory === "for-you") {
      // Show all content for "For you"
      return {
        title: "For you",
        subtitle: "Because you're looking for a handyman",
        services: [...popularServices, ...diyServices, ...gardeningServices, ...movingServices],
        providers: providers,
        showAllSections: true
      };
    }

    // Find the selected category
    const category = CATEGORIES.find(cat => cat.slug === activeCategory);
    if (!category) {
      return {
        title: "Services",
        subtitle: "Browse our services",
        services: popularServices,
        providers: [],
        showAllSections: false
      };
    }

    // Filter services based on category
    const categoryServices = [
      ...popularServices.filter(s => s.href.includes(activeCategory)),
      ...diyServices.filter(s => s.href.includes(activeCategory)),
      ...gardeningServices.filter(s => s.href.includes(activeCategory)),
      ...movingServices.filter(s => s.href.includes(activeCategory))
    ];

    const categoryProviders = providers.filter((provider) =>
      provider.category.toLowerCase().includes(activeCategory.toLowerCase()),
    );

    return {
      title: category.name,
      subtitle: `Browse ${category.name.toLowerCase()} services`,
      services: categoryServices.length > 0 ? categoryServices : popularServices,
      providers: categoryProviders,
      showAllSections: false,
      category: category
    };
  }, [activeCategory, providers]);

  const content = filteredContent;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mt-4 lg:mt-6">
        {/* Dynamic Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h1>
          <p className="text-gray-600">{content.subtitle}</p>
        </div>

        {/* Category Tabs */}
        <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        {/* Promo Banner - Only show for "For you" */}
        {content.showAllSections && (
          <PromoBanner
            title="50% right now: take advantage and book your service in one click!"
            description=""
            ctaText="Request a service"
            ctaHref="/questionnaire?from_dashboard=true"
            bgColor="bg-red-500"
          />
        )}

        {/* Services Section */}
        <ServiceSection 
          title={content.showAllSections ? "The most popular at the moment" : `Popular ${content.title.toLowerCase()} services`} 
          services={content.services} 
        />

        {/* Providers Section - Only show if there are providers */}
        {content.providers.length > 0 && (
          <ProviderSection 
            title={content.showAllSections ? "Book a handyman" : `Book ${content.title.toLowerCase()} experts`} 
            providers={content.providers} 
          />
        )}

        {/* Category-specific sections - Only show for "For you" */}
        {content.showAllSections && (
          <>
            {/* DIY Services */}
            <ServiceSection title="Popular DIY services" services={diyServices} />

            {/* Practical Categories */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Practical and useful categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practicalCategories.map((category, index) => (
                  <LargeServiceCard key={index} {...category} />
                ))}
              </div>
            </div>

            {/* Children Categories */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Services for children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {childrenCategories.map((category, index) => (
                  <LargeServiceCard key={index} {...category} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* App Download Banner */}
        <div className="bg-red-500 rounded-2xl p-6 mb-8 text-white overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Even easier with the</h3>
              <p className="text-white/90">
                Manage your day-to-day life at your fingertips, with access to exclusive features and services.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-black rounded-lg px-4 py-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.98 1.15-3.11-1.14.05-2.51.76-3.33 1.66-.66.75-1.23 1.97-1.14 3.08 1.27.1 2.54-.69 3.32-1.63z" />
                </svg>
                <div className="text-white">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </div>
              <div className="bg-black rounded-lg px-4 py-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31zM6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z" />
                </svg>
                <div className="text-white">
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moving Services */}
        <ServiceSection title="Move, relocate, clear away" services={movingServices} />

        {/* Gardening Services */}
        <ServiceSection title="Maintenance of your green spaces" services={gardeningServices} />

        {/* Childcare Banner */}
        <div className="bg-pink-300 rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="relative">
            <h3 className="text-xl font-bold text-gray-900 mb-2">New childcare products</h3>
            <p className="text-gray-800 mb-4">Book your ideal childminder or babysitter.</p>
            <a
              href="/questionnaire?category=enfants&from_dashboard=true"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Discover
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Children Categories */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">For children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childrenCategories.map((category, index) => (
              <LargeServiceCard key={index} {...category} />
            ))}
          </div>
        </div>

        {/* Save Time Services */}
        <ServiceSection title="Save time" services={saveTimeServices} />

        {/* Gift Card Banner */}
        <div className="bg-blue-400 rounded-2xl p-6 mb-8 text-white">
          <h3 className="text-xl font-bold mb-2">A gift card for your loved ones</h3>
          <p className="text-white/90">Here's a great gift: free time for your loved ones or colleagues.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
