import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ThumbsUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmergencyJobsSection } from "@/components/shared/EmergencyJobsSection";
import { RealProvidersSection } from "@/components/shared/RealProvidersSection";
import { BuyerProviderMarketplace } from "@/components/search/BuyerProviderMarketplace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMarketplaceProviders, getProviderCards, type ProviderCardData } from "@/lib/real-providers";

export const dynamic = "force-dynamic";

const WINTER_SERVICES = [
    {
        title: "Babysitting",
        description: "A moment of play just for them, for as long as they need it",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=enfants&subcategory=babysitting-hiver",
    },
    {
        title: "Weekend and vacation care",
        description: "Peaceful and fulfilling holidays for the whole family",
        image: "https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=hiver&subcategory=garde-vacances-hiver",
    },
    {
        title: "Dog sitting",
        description: "Their routines and activities, even during the winter holidays",
        image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=animaux&subcategory=dog-sitting-hiver",
    },
];

const SPRING_SERVICES = [
    {
        title: "Spring cleaning",
        description: "Refresh your home before spring",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=menage&subcategory=deep-cleaning-menage",
    },
    {
        title: "Get rid of bulky items",
        description: "Clear the clutter before spring",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=demenagement&subcategory=help-moving-demenagement",
    },
    {
        title: "Interior painting",
        description: "Create a new atmosphere",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
        href: "/questionnaire?category=bricolage&subcategory=painting-bricolage",
    },
];


async function getBuyerMarketplaceUser() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const [{ data: profile }, { data: seller }] = await Promise.all([
        supabase
            .from("eloo_profiles")
            .select("role,first_name,last_name")
            .eq("id", user.id)
            .maybeSingle(),
        supabase
            .from("sellers")
            .select("id,first_name,last_name")
            .eq("id", user.id)
            .maybeSingle(),
    ]);

    const role = String(profile?.role || user.user_metadata?.role || "client").toLowerCase();
    if (seller || ["admin", "provider", "seller"].includes(role)) return null;

    const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ")
        || user.user_metadata?.first_name
        || user.user_metadata?.full_name
        || user.email?.split("@")[0]
        || "there";

    return { displayName };
}

export default async function CataloguePage() {
    const buyer = await getBuyerMarketplaceUser();

    if (buyer) {
        const marketplaceProviders = await getMarketplaceProviders();
        return <BuyerProviderMarketplace providers={marketplaceProviders} buyerName={buyer.displayName} />;
    }

    const providers = await getProviderCards();

    return <OriginalFindProviderPage providers={providers} />;
}

function OriginalFindProviderPage({ providers }: { providers: ProviderCardData[] }) {
    return (
        <div className="pt-20 pb-20 min-h-screen bg-white dark:bg-gray-950">
            {/* Hero Container - Wider than the rest, but constrained */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Hero Banner */}
                <section className="relative w-full h-[20rem] sm:h-[24rem] lg:h-[26rem] rounded-3xl overflow-hidden shadow-xl mt-4">
                    <Image
                        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
                        alt="Interior inspiration"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>

                    <div className="absolute inset-y-0 left-0 p-8 sm:p-10 lg:p-12 flex flex-col justify-center max-w-2xl">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                            More comfort, more freedom, explore this month&apos;s inspirations
                        </h1>
                    </div>

                    {/* Floating UI Elements (Simulating the overlapping badges) */}
                    <div className="hidden lg:block absolute top-[15%] right-[10%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        👩‍🍳 Preparing meals
                    </div>
                    <div className="hidden lg:flex absolute top-[35%] right-[15%] bg-red-50/95 backdrop-blur-sm rounded-xl p-2 pr-6 items-center gap-3 shadow-2xl overflow-hidden cursor-default border border-red-100">
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-2xl relative overflow-hidden">
                            <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" alt="avatar" fill className="object-cover" />
                        </div>
                        <span className="font-bold text-red-900 text-sm">Server / Waitress</span>
                    </div>
                    <div className="hidden lg:block absolute bottom-[25%] right-[25%] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-bold shadow-2xl text-gray-800 cursor-default">
                        🧸 Valentine&apos;s babysitter
                    </div>
                </section>
            </div>

            {/* Main Content Container - Narrower to match Yoojo reference */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 space-y-16 lg:space-y-24">

                {/* Travel Promo Banner */}
                <Link href="/questionnaire?category=aide-domicile&subcategory=accompagnement" className="relative block w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop"
                        alt="Airplane flying"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-indigo-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center p-8 sm:p-12">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white max-w-3xl drop-shadow-md">
                            Book a service in February and get a chance to win $1,000 for your next trip*
                        </h2>
                    </div>
                </Link>

                {/* Plan your winter holidays */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Plan your winter holidays
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {WINTER_SERVICES.map((service, index) => (
                            <Link key={index} href={service.href} className="group cursor-pointer">
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0"></div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Moving Soon Banner */}
                <Link href="/questionnaire?category=demenagement&subcategory=help-moving-demenagement" className="relative block w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                    <Image
                        src="https://images.unsplash.com/photo-1600566753086-00f18efc2253?q=80&w=2000&auto=format&fit=crop"
                        alt="Moving boxes"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 object-center"
                    />
                    <div className="absolute inset-0 bg-red-900/60 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent"></div>

                    <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-12 max-w-2xl">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 drop-shadow-md">
                            Moving soon?
                        </h2>
                        <p className="text-sm sm:text-base text-gray-100 mb-6 font-medium text-red-50">
                            Estimate the volume of your belongings in just a few clicks and find the right van for your move.
                        </p>
                        <Button className="w-fit rounded-full bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 shadow-xl">
                            Discover <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Link>

                {/* Brighten up your home */}
                <section>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                        Brighten up your home
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {SPRING_SERVICES.map((service, index) => (
                            <Link key={index} href={service.href} className="group cursor-pointer">
                                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4 shadow-sm">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {service.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
                <EmergencyJobsSection />
                {/* Providers Grid */}
                <RealProvidersSection title="Our providers are here for you all February" providers={providers} />

                {/* Selection Criteria / Trust Footer */}
                <section className="pt-16 pb-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                            Selection criteria.
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Members&apos; opinions</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Consult the verified reviews of other users to choose your ideal home service provider.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ThumbsUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Quality-price badge</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Our dedicated badge makes it easy to identify the best value providers in your area.
                            </p>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="w-14 h-14 mx-auto md:mx-0 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Verified identity</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                All providers undergo a complete identity verification process to ensure absolute security.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
