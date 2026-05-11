import { Badge } from "@/components/ui";
import { StudentStatus } from "@/lib/types";

const statusStyles: Record<StudentStatus, "success" | "neutral" | "warning" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  GRADUATED: "neutral",
  TRANSFERRED: "warning",
  WITHDRAWN: "error"
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <Badge variant={statusStyles[status]}>{status.toLowerCase().replace("_", " ")}</Badge>;
}
