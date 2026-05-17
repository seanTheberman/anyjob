import { Download, UserPlus } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { UsersWorklist } from "../_components/AdminSelectableTables";
import { adminUsers } from "../_components/admin-data";

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Users"
      description="Search clients, inspect booking history, identify risky accounts, resend invites, and prepare account actions."
      actions={
        <>
          <AdminButtonLink href="/admin/reports">
            <Download className="h-4 w-4" />
            Export users
          </AdminButtonLink>
          <AdminButtonLink href="/admin/settings">
            <UserPlus className="h-4 w-4" />
            Invite user
          </AdminButtonLink>
        </>
      }
    >
      <UsersWorklist users={adminUsers} />
    </AdminShell>
  );
}
