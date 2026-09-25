import { Hero } from "@/components/landing/Hero";
import { SearchBar } from "@/components/landing/SearchBar";
import { CategoryBar } from "@/components/landing/CategoryBar";
import { PopularServices } from "@/components/landing/PopularServices";
import { HomeEngagement } from "@/components/landing/HomeEngagement";
import { WorkShiftsSection } from "@/components/landing/WorkShiftsSection";

export default function HomePage() {
  return (
    <>
      <div className="relative">
        <Hero />
        <SearchBar />
      </div>
      <CategoryBar />
      <PopularServices />
      <WorkShiftsSection />
      <HomeEngagement />
    </>
  );
}
