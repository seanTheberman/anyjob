import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Check, Clock, MapPin, Star } from "lucide-react";
import { ProviderProfileLayout } from "@/components/providers/ProviderProfileLayout";
import { getProviderProfileById } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const normalizedId = decodeURIComponent(id).replace(/\.$/, "");
    const provider = await getProviderProfileById(normalizedId);
    const initials = provider.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
    const bookingHref = `/questionnaire?provider=${encodeURIComponent(provider.id)}&providerName=${encodeURIComponent(provider.name)}&providerCategory=${encodeURIComponent(provider.categorySlug)}`;

    return (
        <ProviderProfileLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero: Image Left, Info Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Image */}
                    <div className="relative">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                            {provider.avatar ? (
                                <Image src={provider.avatar} alt={provider.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 text-6xl font-extrabold text-gray-500">
                                    {initials || provider.name[0]?.toUpperCase() || "P"}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Info */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.name}</h1>
                        <p className="text-gray-600 mb-4">{provider.category}</p>
                        <div className="flex items-center mb-6">
                            <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                            <span className="text-gray-900 font-medium">{provider.rating}</span>
                            <span className="text-gray-500 ml-1">({provider.reviewCount} reviews)</span>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <Briefcase className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.services.slice(0, 2).join(" · ")}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.location}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <Clock className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.experience}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link href={bookingHref} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700">
                                Book this provider
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <p className="mt-3 text-sm text-gray-500">
                            Booking starts with job details first. You will describe the work before any booking is confirmed.
                        </p>
                    </div>
                </div>

                {/* Biography */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Biography</h2>
                    <p className="text-gray-700 leading-relaxed">{provider.biography}</p>
                </section>

                {/* Service Offer */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Offer</h2>
                    <div className="flex flex-wrap gap-3">
                        {provider.services.map((service) => (
                            <span key={service} className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-full text-sm font-medium">
                                {service}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Pricing & Availability */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing & Availability</h2>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                <Briefcase className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-gray-700"><strong>Hourly Rate:</strong> {provider.hourlyRate}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                <Clock className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-gray-700"><strong>Availability:</strong> {provider.availability}</span>
                        </div>
                    </div>
                </section>

                {provider.photos.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Photos</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {provider.photos.map((photo, index) => (
                                <div key={photo} className="aspect-square relative rounded-lg overflow-hidden">
                                    <Image src={photo} alt={`Work ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Why Choose Me */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Me?</h2>
                    <ul className="space-y-3">
                        {provider.highlights.map((item, index) => (
                            <li key={index} className="flex items-center">
                                <Check className="w-5 h-5 mr-3 text-green-500" />
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Rating & Review */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Rating & Review</h2>
                    
                    {/* Rating Summary with Star Breakdown */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        {/* Left - Overall Rating */}
                        <div className="flex flex-col items-center justify-center md:w-1/3">
                            <div className="text-5xl font-bold text-gray-900">{provider.rating.toFixed(1)}</div>
                            <div className="text-gray-600 mt-1">out of 5</div>
                            <div className="text-gray-600">{provider.reviewCount} Reviews</div>
                        </div>
                        
                        {/* Right - Star Breakdown */}
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map((stars) => (
                                <div key={stars} className="flex items-center gap-3">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                className={`w-5 h-5 ${i < stars ? "text-yellow-400 fill-current" : "text-gray-200"}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500 rounded-full" 
                                            style={{ width: stars === 5 ? '68%' : stars === 4 ? '24%' : stars === 3 ? '6%' : stars === 2 ? '1%' : '1%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Reviews are shown from completed bookings. Only clients who booked and completed work with this provider can leave a rating.
                    </div>

                    <div className="border-t border-gray-200 pt-6 text-sm text-gray-600">
                        No written reviews are available for this provider yet.
                    </div>
                </section>
            </div>
        </ProviderProfileLayout>
    );
}
