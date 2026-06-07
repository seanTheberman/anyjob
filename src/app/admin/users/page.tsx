import { Download, UserPlus } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "../_components/AdminShell";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { UsersWorklist } from "../_components/AdminSelectableTables";
import { getAdminUsers } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

async function UsersContent() {
  const users = await getAdminUsers();

  return <UsersWorklist users={users} />;
}

export default function AdminUsersPage() {

  return (
    <AdminShell
      title="Users"
      description="Search clients, inspect booking history, identify risky accounts, resend invites, and prepare account actions."
      actions={
        <>
          <AdminButtonLink href="/api/admin/export?kind=users">
            <Download className="h-4 w-4" />
            Export users
          </AdminButtonLink>
          <AdminActionButton label="Invite user" context="admin user invitation">
            <UserPlus className="h-4 w-4" />
            Invite user
          </AdminActionButton>
        </>
      }
    >
      <Suspense fallback={<div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading users...</div>}>
        <UsersContent />
      </Suspense>
    </AdminShell>
  );
}
