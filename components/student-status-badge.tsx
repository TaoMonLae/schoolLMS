import { formatEnumLabel } from "@/lib/students";
import { StudentStatus } from "@/lib/types";

const statusStyles: Record<StudentStatus, string> = {
  ACTIVE: "bg-[#e8f3dc] text-[#315933] border-[#c9e5bf]",
  INACTIVE: "bg-rice text-moss border-line",
  GRADUATED: "bg-[#e7f0ff] text-[#24508f] border-[#bfd5f7]",
  TRANSFERRED: "bg-[#fff2d4] text-[#7a5211] border-[#f0d38a]",
  WITHDRAWN: "bg-[#ffe4df] text-[#8b2b20] border-[#f2b9af]"
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>{formatEnumLabel(status)}</span>;
}
