import { Badge } from "@/components/ui";
import { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  TEACHER: "Teacher",
  STUDENT: "Student",
  CASE_MANAGER: "Case Manager"
};

const roleVariants: Record<Role, "purple" | "orange" | "green" | "lavender" | "neutral"> = {
  SUPER_ADMIN: "purple",
  SCHOOL_ADMIN: "orange",
  TEACHER: "green",
  STUDENT: "lavender",
  CASE_MANAGER: "neutral"
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={roleVariants[role]}>{roleLabels[role]}</Badge>;
}
