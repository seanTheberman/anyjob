import { NotificationCenter } from "@/components/notifications/NotificationBell";
import { ProviderLayout } from "@/components/provider/ProviderLayout";

export default function NotificationsPage() {
  return (
    <ProviderLayout>
      <NotificationCenter accent="green" showInsuranceNotice />
    </ProviderLayout>
  );
}
