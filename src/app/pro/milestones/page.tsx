import { MilestonesClient } from "@/components/badges/MilestonesClient";
import { ProviderLayout } from "@/components/provider/ProviderLayout";

export default function ProviderMilestonesPage() {
  return (
    <ProviderLayout>
      <MilestonesClient role="provider" />
    </ProviderLayout>
  );
}
