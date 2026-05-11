import Image from "next/image";
import { getStudentInitials } from "@/lib/students";
import { StudentRecord } from "@/lib/types";

export function StudentPhoto({ student, size = "md" }: { student: Pick<StudentRecord, "legalName" | "preferredName" | "photoUrl">; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-24 w-24 text-3xl"
  }[size];

  if (student.photoUrl) {
    return (
      <Image
        src={student.photoUrl}
        alt={`${student.preferredName || student.legalName} profile`}
        width={96}
        height={96}
        className={`${sizeClass} rounded-md object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md bg-ink font-semibold text-on-dark`}>
      {getStudentInitials(student)}
    </div>
  );
}
