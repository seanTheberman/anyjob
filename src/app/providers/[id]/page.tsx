import Image from "next/image";
import { Mail, MapPin, Phone, Star, Check, MessageCircle } from "lucide-react";
import { ProviderProfileLayout } from "@/components/providers/ProviderProfileLayout";

const PROVIDERS: Record<string, ProviderProfile> = {
    "volodymyr-handyman": {
        id: "volodymyr-handyman",
        name: "Volodymyr",
        category: "Handyman",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
        rating: 4.8,
        reviewCount: 23,
        email: "volodymyr@anyjob.com",
        phone: "+33 7 56 23 45 01",
        location: "Lyon, France",
        experience: "5+ Years of Experience",
        biography: "Detail-oriented handyman specializing in quick fixes, furniture assembly, and light renovation. Clients praise Volodymyr for transparent communication and spotless results on every visit.",
        services: ["Furniture assembly", "Light renovation", "Painting", "Emergency handyman"],
        hourlyRate: "From $10 / hour",
        availability: "Available this week (evenings & weekends)",
        photos: [
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1503389152951-9f343605f61e?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505533321630-975218a5f66f?q=80&w=800&auto=format&fit=crop",
        ],
        highlights: [
            "Verified identity & insurance",
            "Impeccable finish, zero mess",
            "Highly rated for punctuality",
        ],
    },
};

type ProviderProfile = {
    id: string;
    name: string;
    category: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    email: string;
    phone: string;
    location: string;
    experience: string;
    biography: string;
    services: string[];
    hourlyRate: string;
    availability: string;
    photos: string[];
    highlights: string[];
};

function buildFallbackProvider(slug: string): ProviderProfile {
    return {
        id: slug,
        name: "Provider",
        category: "Service",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
        rating: 4.8,
        reviewCount: 12,
        email: "provider@anyjob.com",
        phone: "+33 6 10 20 30 40",
        location: "France",
        experience: "Verified professional",
        biography: "Experienced service provider.",
        services: ["General services"],
        hourlyRate: "Contact for quote",
        availability: "Flexible schedule",
        photos: [
            "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1503389152951-9f343605f61e?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1505533321630-975218a5f66f?q=80&w=800&auto=format&fit=crop",
        ],
        highlights: ["Verified", "Reliable", "Professional"],
    };
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const normalizedId = decodeURIComponent(id).replace(/\.$/, "");
    const provider = PROVIDERS[normalizedId] ?? buildFallbackProvider(normalizedId);

    return (
        <ProviderProfileLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero: Image Left, Info Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Image */}
                    <div className="relative">
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                            <Image src={provider.avatar} alt={provider.name} fill className="object-cover" />
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
                                    <Mail className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.email}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.location}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <Phone className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                    <MessageCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="text-gray-700">{provider.experience}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                Book this provider
                            </button>
                            <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                Send a message
                            </button>
                        </div>
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
                                <MessageCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-gray-700"><strong>Hourly Rate:</strong> {provider.hourlyRate}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
                                <MessageCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-gray-700"><strong>Availability:</strong> {provider.availability}</span>
                        </div>
                    </div>
                </section>

                {/* Work Photos */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {provider.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                <Image src={photo} alt={`Work ${index + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                        <div className="aspect-square relative rounded-lg overflow-hidden">
                            <Image src={provider.photos[3]} alt="Work 4" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">+4</span>
                            </div>
                        </div>
                    </div>
                </section>

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
                            <div className="text-5xl font-bold text-gray-900">4.8</div>
                            <div className="text-gray-600 mt-1">out of 5</div>
                            <div className="text-gray-600">23 Reviews</div>
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

                    {/* Give Rating & Write Review */}
                    <div className="mb-6">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-gray-700">Give us rating</span>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-6 h-6 text-gray-200 cursor-pointer hover:text-yellow-400" />
                                ))}
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Write a Review
                        </button>
                    </div>

                    {/* Review Form */}
                    <div className="mb-8">
                        <textarea 
                            className="w-full h-32 p-4 bg-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Share your experience..."
                        />
                        <div className="flex justify-end mt-4">
                            <button className="bg-red-500 text-white px-8 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Customer Reviews */}
                    <div className="space-y-6 border-t border-gray-200 pt-6">
                        {[1, 2].map((review, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                                    <Image 
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" 
                                        alt="Amanda P." 
                                        width={48} 
                                        height={48} 
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-gray-900">Amanda P.</span>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`w-4 h-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-gray-600 text-sm">(4.9/5)</span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        The service was both professional and affordable, exceeding my expectations. Right from the start, the contractor was transparent about the process, ensuring clarity in every step. They took the time to explain the issue in detail before beginning the work, making me feel confident in their expertise. Not only did they provide a clear breakdown of the repairs needed, but they also discussed potential solutions and costs upfront. There were no hidden fees or surprises, which I truly appreciated. Throughout the job, they maintained excellent communication, keeping me informed of the progress. The work was completed efficiently, with great attention to detail and professionalism. I highly recommend their services for anyone looking for reliable and transparent home repairs!
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </ProviderProfileLayout>
    );
}
