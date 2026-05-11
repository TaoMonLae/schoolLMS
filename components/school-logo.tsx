import { School } from "lucide-react";
import { getReadableTextColor } from "@/lib/color-contrast";
import type { SchoolSummary } from "@/lib/types";

type SchoolLogoProps = {
  school: Pick<SchoolSummary, "name" | "shortName" | "logoUrl" | "primaryColor">;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
};

export function SchoolLogo({ school, className = "h-10 w-10", imageClassName = "h-full w-full object-contain", iconClassName = "h-5 w-5" }: SchoolLogoProps) {
  const label = `${school.shortName || school.name} logo`;

  if (school.logoUrl) {
    return (
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-hairline bg-canvas ${className}`}>
        <img src={school.logoUrl} alt={label} className={imageClassName} />
      </span>
    );
  }

  return (
    <span className={`flex shrink-0 items-center justify-center rounded-md text-on-dark ${className}`} style={{ backgroundColor: school.primaryColor, color: getReadableTextColor(school.primaryColor) }}>
      <School className={iconClassName} aria-hidden="true" />
    </span>
  );
}
