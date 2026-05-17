"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import { Sparkles, Snowflake, Wrench, Flower2, Truck, Home, Baby, Cat, Monitor, HeartHandshake, GraduationCap } from "lucide-react";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

// Map category slugs to icons
const categoryIcons: Record<string, any> = {
  "for-you": Sparkles,
  "hiver": Snowflake,
  "bricolage": Wrench,
  "jardinage": Flower2,
  "demenagement": Truck,
  "menage": Home,
  "enfants": Baby,
  "animaux": Cat,
  "informatique": Monitor,
  "aide-domicile": HeartHandshake,
  "cours-particuliers": GraduationCap,
};

// Get display categories
const getDisplayCategories = () => {
  const mainCategories = [
    { id: "for-you", label: "For you", icon: Sparkles },
    ...CATEGORIES.map(cat => ({
      id: cat.slug,
      label: cat.name,
      icon: categoryIcons[cat.slug] || Sparkles,
      color: cat.color
    }))
  ];
  return mainCategories;
};

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = getDisplayCategories();
  
  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          const color = 'color' in category ? category.color : "#EF4444";

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-3 min-w-[80px] rounded-lg transition-all whitespace-nowrap relative",
                isActive
                  ? "text-red-600 bg-red-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-gray-400")} />
              <span className="text-xs font-medium">{category.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
