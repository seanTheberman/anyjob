"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

interface ServiceSectionProps {
  title: string;
  services: ServiceCard[];
}

export function ServiceSection({ title, services }: ServiceSectionProps) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <Link
            key={service.id}
            href={service.href}
            className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
          >
            <div className="relative h-40 overflow-hidden">
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{service.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface LargeServiceCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
}

export function LargeServiceCard({ title, description, image, href }: LargeServiceCardProps) {
  return (
    <Link
      href={href}
      className="group relative block rounded-xl overflow-hidden h-48"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/80 mb-3 line-clamp-2">{description}</p>
        <span className="inline-flex items-center gap-1 text-sm text-white font-medium">
          Discover
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
