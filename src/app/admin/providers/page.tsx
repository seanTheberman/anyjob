import { AdminSectionPage } from "../_components/AdminSectionPage";

export default function AdminProvidersPage() {
  return (
    <AdminSectionPage
      title="Manage Providers"
      description="Review seller profiles, verification, and service coverage."
      columns={["Provider", "Service", "Verification"]}
      rows={[
        ["John Doe", "Handyman", "Verified"],
        ["Amelia Brown", "Cleaning", "Pending"],
        ["Noah Smith", "Gardening", "Verified"],
      ]}
    />
  );
}
