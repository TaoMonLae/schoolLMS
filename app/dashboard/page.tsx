import { BookOpenCheck, CalendarCheck, GraduationCap, School, ShieldCheck } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { getTodayAttendanceSummary } from "@/lib/attendance";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getRequiredCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  const attendance = await getTodayAttendanceSummary(currentUser);
  const stats = [
    { label: "Students", value: school.activeStudents, icon: GraduationCap },
    { label: "Classes", value: school.activeClasses, icon: BookOpenCheck },
    { label: "Staff roles", value: 5, icon: ShieldCheck },
    { label: "Present / absent today", value: `${attendance.present}/${attendance.absent}`, icon: CalendarCheck }
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="School dashboard"
        title={school.name}
        description={`${school.city}, ${school.country} | Code ${school.code}`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <DashboardCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf text-white">
              <School className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Operating Snapshot</h2>
              <p className="text-sm text-moss">Initial seed data is ready for tenant-scoped LMS workflows.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Enrollment", "Attendance", "Case support"].map((item) => (
              <div key={item} className="rounded-md border border-line bg-rice p-4">
                <p className="text-sm font-medium text-ink">{item}</p>
                <p className="mt-2 text-xs leading-5 text-moss">Scoped by school_id for safe multi-tenant access.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Default Roles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <RoleBadge role="SUPER_ADMIN" />
            <RoleBadge role="SCHOOL_ADMIN" />
            <RoleBadge role="TEACHER" />
            <RoleBadge role="STUDENT" />
            <RoleBadge role="CASE_MANAGER" />
          </div>
        </div>
      </section>
    </div>
  );
}
