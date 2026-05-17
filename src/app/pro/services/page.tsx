"use client";

import { ProviderLayout } from "@/components/provider/ProviderLayout";
import { Plus, Edit2, Trash2, Check } from "lucide-react";
import { useState } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  active: boolean;
}

const mockServices: Service[] = [
  {
    id: "1",
    name: "Furniture Assembly",
    description: "Assembly of all types of furniture including IKEA, beds, wardrobes, and more",
    hourlyRate: 25,
    active: true,
  },
  {
    id: "2",
    name: "General Handyman",
    description: "Home repairs, installations, and general maintenance work",
    hourlyRate: 28,
    active: true,
  },
  {
    id: "3",
    name: "Interior Painting",
    description: "Professional painting services for walls, ceilings, and trim",
    hourlyRate: 30,
    active: true,
  },
  {
    id: "4",
    name: "Garden Maintenance",
    description: "Lawn mowing, hedge trimming, and general garden upkeep",
    hourlyRate: 22,
    active: false,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(mockServices);

  return (
    <ProviderLayout>
      <div className="max-w-4xl mx-auto mt-4 lg:mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Services</h1>
            <p className="text-gray-600">Manage the services you offer to clients</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>

        {/* Active Services */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Active Services</h2>
          <div className="space-y-4">
            {services
              .filter((s) => s.active)
              .map((service) => (
                <div key={service.id} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{service.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Hourly Rate:</span>
                          <span className="text-lg font-bold text-gray-900">£{service.hourlyRate}/h</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Inactive Services */}
        {services.filter((s) => !s.active).length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Inactive Services</h2>
            <div className="space-y-4">
              {services
                .filter((s) => !s.active)
                .map((service) => (
                  <div key={service.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-700">{service.name}</h3>
                          <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        </div>
                        <p className="text-gray-500 mb-3">{service.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Hourly Rate:</span>
                            <span className="text-lg font-bold text-gray-700">£{service.hourlyRate}/h</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          <Check className="w-4 h-4" />
                          Activate
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
