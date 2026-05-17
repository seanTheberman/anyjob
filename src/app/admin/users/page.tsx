import { Download, UserPlus } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { AdminButtonLink, AdminTable, Toolbar } from "../_components/AdminPrimitives";
import { users } from "../_components/admin-data";

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
      <Toolbar>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Bulk message</button>
        <button className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Risk filter</button>
      </Toolbar>
      <AdminTable columns={["Name", "Role", "Email", "History", "Status"]} rows={users} />
    </AdminShell>
  );
}
