import { MilestonesClient } from "@/components/badges/MilestonesClient";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function BuyerMilestonesPage() {
  return (
    <DashboardLayout>
      <MilestonesClient role="buyer" />
    </DashboardLayout>
  );
}
