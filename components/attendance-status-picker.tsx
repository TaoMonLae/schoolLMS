"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { attendanceStatuses } from "@/lib/types";
import type { AttendanceStatus } from "@/lib/types";

const statusClasses: Record<AttendanceStatus, { idle: string; active: string }> = {
  PRESENT: {
    idle: "border-success/35 bg-tint-mint text-success hover:border-success hover:bg-tint-mint/85",
    active: "border-success bg-success text-brand-navy shadow-soft ring-4 ring-success/20"
  },
  LATE: {
    idle: "border-warning/35 bg-tint-yellow text-warning hover:border-warning hover:bg-tint-yellow/85",
    active: "border-warning bg-warning text-brand-navy shadow-soft ring-4 ring-warning/20"
  },
  ABSENT: {
    idle: "border-error/35 bg-tint-rose text-error hover:border-error hover:bg-tint-rose/85",
    active: "border-error bg-error text-on-primary shadow-soft ring-4 ring-error/20"
  },
  EXCUSED: {
    idle: "border-link/35 bg-tint-sky text-link hover:border-link hover:bg-tint-sky/85",
    active: "border-link bg-link text-on-primary shadow-soft ring-4 ring-link/20"
  }
};

function formatStatusLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AttendanceStatusPicker({ studentId, studentName, defaultStatus, disabled = false }: { studentId: string; studentName: string; defaultStatus: AttendanceStatus; disabled?: boolean }) {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(defaultStatus);

  return (
    <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={`Status for ${studentName}`}>
      <input type="hidden" name={`status-${studentId}`} value={selectedStatus} />
      {attendanceStatuses.map((status) => {
        const selected = selectedStatus === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => setSelectedStatus(status)}
            className={clsx(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border-2 px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
              selected ? statusClasses[status].active : statusClasses[status].idle
            )}
          >
            <Check className={clsx("h-3.5 w-3.5", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
            {formatStatusLabel(status)}
          </button>
        );
      })}
    </fieldset>
  );
}
