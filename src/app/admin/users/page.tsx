import { Download, UserPlus } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "../_components/AdminShell";
import { AdminActionButton } from "../_components/AdminActionButton";
import { AdminButtonLink } from "../_components/AdminPrimitives";
import { UsersWorklist } from "../_components/AdminSelectableTables";
import { type AdminSearchParams, firstParam, paramIn } from "../_lib/admin-query";
import { getAdminUsers } from "../_lib/admin-live-data";

export const dynamic = "force-dynamic";

const userStatuses = ["all", "Active", "Watchlisted", "Pending email", "VIP", "Suspended", "Blocked"] as const;
const riskLevels = ["all", "Low", "Medium", "High"] as const;

async function UsersContent({ initialStatus, initialRisk, initialQuery }: { initialStatus: string; initialRisk: string; initialQuery: string }) {
  const users = await getAdminUsers();

  return <UsersWorklist users={users} initialStatus={initialStatus} initialRisk={initialRisk} initialQuery={initialQuery} />;
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: AdminSearchParams }) {
  const params = (await searchParams) || {};
  const requestedStatus = firstParam(params, "status");
  const initialStatus = paramIn(requestedStatus === "Blocked" ? "Suspended" : requestedStatus, userStatuses, "all");
  const initialRisk = paramIn(firstParam(params, "risk"), riskLevels, "all");
  const initialQuery = firstParam(params, "q", "");

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
        <UsersContent initialStatus={initialStatus} initialRisk={initialRisk} initialQuery={initialQuery} />
      </Suspense>
    </AdminShell>
  );
}
