import { AdminSectionPage } from "../_components/AdminSectionPage";

export default function AdminJobsPage() {
  return (
    <AdminSectionPage
      title="Manage Jobs"
      description="Monitor active requests, bookings, and platform job flow."
      columns={["Job", "Category", "Status"]}
      rows={[
        ["Furniture Assembly", "DIY", "Open"],
        ["Deep Cleaning", "Cleaning", "Matched"],
        ["Garden Maintenance", "Gardening", "Completed"],
      ]}
    />
  );
}
