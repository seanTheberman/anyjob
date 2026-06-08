import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NotificationCenter } from "@/components/notifications/NotificationBell";

export default function DashboardNotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationCenter />
    </DashboardLayout>
  );
}
