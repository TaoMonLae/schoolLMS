import type { LucideIcon } from "lucide-react";

type DashboardCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function DashboardCard({ label, value, icon: Icon }: DashboardCardProps) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-moss">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-clay text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
