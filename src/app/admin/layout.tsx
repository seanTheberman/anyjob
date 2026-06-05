import { AdminFrame } from "./_components/AdminFrame";
import { getUnreadAdminNotificationCount } from "./_lib/admin-notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const unreadNotifications = await getUnreadAdminNotificationCount();

  return <AdminFrame unreadNotifications={unreadNotifications}>{children}</AdminFrame>;
}
