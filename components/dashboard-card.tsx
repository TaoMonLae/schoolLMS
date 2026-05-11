import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/ui";

type DashboardCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function DashboardCard({ label, value, icon: Icon }: DashboardCardProps) {
  return <StatCard label={label} value={value} icon={<Icon className="h-5 w-5" aria-hidden="true" />} />;
}
