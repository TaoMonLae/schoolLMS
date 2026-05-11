import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { roles } from "@/lib/types";

export default function AccessControlPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Access Control"
        title="Role-Based Permissions"
        description="Assign user access using predefined roles that are ready for an auth session layer."
      />
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <RoleBadge key={role} role={role} />
        ))}
      </div>
    </div>
  );
}
