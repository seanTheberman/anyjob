import { ProviderCard } from "@/components/ui/provider-card";
import { ProviderSlider } from "@/components/ui/provider-slider";
import type { ProviderCardData } from "@/lib/real-providers";

type RealProvidersSectionProps = {
  title: string;
  providers: ProviderCardData[];
};

export function RealProvidersSection({ title, providers }: RealProvidersSectionProps) {
  return (
    <section>
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      {providers.length > 0 ? (
        <ProviderSlider>
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </ProviderSlider>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            No approved real providers are available here yet.
          </p>
        </div>
      )}
    </section>
  );
}
