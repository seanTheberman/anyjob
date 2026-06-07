import type { Metadata } from "next";
import { HowItWorksExperience } from "@/components/how-it-works/HowItWorksExperience";

export const metadata: Metadata = {
    title: "How AnyJob works for customers, businesses, providers, and workers",
    description:
        "Explore how AnyJob helps people book services, businesses hire workers, providers win client jobs, and freelancers find flexible paid work.",
};

export default function HowItWorksPage() {
    return <HowItWorksExperience />;
}
