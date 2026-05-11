import { Role } from "@/lib/types";

type RoleBadgeProps = {
  role: Role;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className="rounded-md border border-line bg-rice px-3 py-2 text-xs font-semibold text-ink">
      {role.replace("_", " ")}
    </span>
  );
}
