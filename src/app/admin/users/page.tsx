import { AdminSectionPage } from "../_components/AdminSectionPage";

export default function AdminUsersPage() {
  return (
    <AdminSectionPage
      title="Manage Users"
      description="Review client accounts, activity, and support status."
      columns={["Name", "Role", "Status"]}
      rows={[
        ["Sarah Johnson", "Client", "Active"],
        ["Marcus Lee", "Client", "Active"],
        ["Emma Wilson", "Client", "Pending review"],
      ]}
    />
  );
}
