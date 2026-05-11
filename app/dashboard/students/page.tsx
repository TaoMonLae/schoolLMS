import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { StudentStatusBadge } from "@/components/student-status-badge";
import { canManageStudents } from "@/lib/rbac";
import { demoClasses, demoCurrentUser, formatEnumLabel, getVisibleStudentsForUser } from "@/lib/students";
import { Gender, genders, StudentStatus, studentStatuses } from "@/lib/types";

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    classId?: string;
    gender?: Gender | "ALL";
    status?: StudentStatus | "ALL";
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.q,
    classId: params?.classId || "ALL",
    gender: params?.gender || "ALL",
    status: params?.status || "ALL"
  };
  const students = getVisibleStudentsForUser(demoCurrentUser, filters);
  const canManage = canManageStudents(demoCurrentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Students" title="Student Records" description="Search, filter, and manage learner profiles with school-scoped access controls." />
        {canManage ? (
          <Link href="/dashboard/students/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-moss">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Student
          </Link>
        ) : null}
      </div>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <form className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <span className="sr-only">Search students</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-moss" aria-hidden="true" />
            <input name="q" defaultValue={filters.search} placeholder="Search name, ID, guardian" className="h-11 w-full rounded-md border border-line bg-rice pl-9 pr-3 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/60 focus:ring-4" />
          </label>
          <FilterSelect name="classId" defaultValue={filters.classId} options={["ALL", ...demoClasses.map((item) => item.id)]} labels={{ ALL: "All classes", ...Object.fromEntries(demoClasses.map((item) => [item.id, item.name])) }} />
          <FilterSelect name="gender" defaultValue={filters.gender} options={["ALL", ...genders]} labels={{ ALL: "All genders" }} />
          <FilterSelect name="status" defaultValue={filters.status} options={["ALL", ...studentStatuses]} labels={{ ALL: "All statuses" }} />
          <button className="h-11 rounded-md bg-ink px-4 text-sm font-bold text-white hover:bg-moss">Filter</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-rice">
              <tr>
                {["Student", "Class", "Gender", "Status", "Guardian", "Emergency", ""].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-moss">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-rice/70">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <StudentPhoto student={student} size="sm" />
                      <div>
                        <Link href={`/dashboard/students/${student.id}`} className="text-sm font-semibold text-ink hover:text-clay">
                          {student.preferredName || student.legalName}
                        </Link>
                        <p className="text-xs text-moss">{student.studentNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-ink">{student.className}</td>
                  <td className="px-4 py-4 text-sm text-moss">{formatEnumLabel(student.gender)}</td>
                  <td className="px-4 py-4">
                    <StudentStatusBadge status={student.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-moss">{student.guardianName || "Not recorded"}</td>
                  <td className="px-4 py-4 text-sm text-moss">{student.emergencyContactPhone || "Not recorded"}</td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/dashboard/students/${student.id}`} className="text-sm font-semibold text-clay hover:text-ink">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-line lg:hidden">
          {students.map((student) => (
            <article key={student.id} className="p-4">
              <div className="flex gap-3">
                <StudentPhoto student={student} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/dashboard/students/${student.id}`} className="font-semibold text-ink">
                        {student.preferredName || student.legalName}
                      </Link>
                      <p className="text-xs text-moss">{student.studentNumber} | {student.className}</p>
                    </div>
                    <StudentStatusBadge status={student.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-moss">Guardian</dt>
                      <dd className="mt-1 text-ink">{student.guardianName || "Not recorded"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-moss">Emergency</dt>
                      <dd className="mt-1 text-ink">{student.emergencyContactPhone || "Not recorded"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </div>

        {students.length === 0 ? <div className="p-8 text-center text-sm text-moss">No students match the current filters.</div> : null}
      </section>
    </div>
  );
}

function FilterSelect({ name, defaultValue, options, labels = {} }: { name: string; defaultValue?: string; options: readonly string[]; labels?: Record<string, string> }) {
  return (
    <select name={name} defaultValue={defaultValue} className="h-11 rounded-md border border-line bg-rice px-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4">
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option] || formatEnumLabel(option)}
        </option>
      ))}
    </select>
  );
}
