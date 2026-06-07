import { AdminFrame } from "./_components/AdminFrame";
import { getUnreadAdminNotificationCount } from "./_lib/admin-notifications";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unreadNotifications = await getUnreadAdminNotificationCount();

  return <AdminFrame unreadNotifications={unreadNotifications}>{children}</AdminFrame>;
}
