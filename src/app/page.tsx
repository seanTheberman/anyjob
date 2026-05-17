import { Hero } from "@/components/landing/Hero";
import { SearchBar } from "@/components/landing/SearchBar";
import { CategoryBar } from "@/components/landing/CategoryBar";
import { SocialProof } from "@/components/landing/SocialProof";
import { PopularServices } from "@/components/landing/PopularServices";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { BecomeProvider } from "@/components/landing/BecomeProvider";

export default function HomePage() {
  return (
    <>
      <div className="relative">
        <Hero />
        <SearchBar />
      </div>
      <CategoryBar />
      <SocialProof />
      <PopularServices />
      <HowItWorks />
      <TrustSection />
      <BecomeProvider />
    </>
  );
}
