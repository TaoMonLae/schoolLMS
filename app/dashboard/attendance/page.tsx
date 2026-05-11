import { Download, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StudentPhoto } from "@/components/student-photo";
import { saveAttendanceBulk } from "@/app/dashboard/attendance/actions";
import {
  attendanceStatusStyles,
  getAttendanceClassesForUser,
  getAttendanceExportRows,
  getExistingAttendanceMap,
  getMonthlyAttendanceReport,
  getAttendanceStudentsForUser
} from "@/lib/attendance";
import { canEditAttendance, canTakeAttendance } from "@/lib/rbac";
import { demoCurrentUser, formatEnumLabel } from "@/lib/students";
import { attendanceStatuses } from "@/lib/types";

type AttendancePageProps = {
  searchParams?: Promise<{
    classId?: string;
    date?: string;
    month?: string;
    saved?: string;
    duplicate?: string;
  }>;
};

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const params = await searchParams;
  const classes = getAttendanceClassesForUser(demoCurrentUser);
  const selectedClassId = params?.classId || classes[0]?.id || "";
  const selectedDate = params?.date || "2026-05-11";
  const selectedMonth = params?.month || selectedDate.slice(0, 7);
  const students = getAttendanceStudentsForUser(demoCurrentUser, selectedClassId);
  const attendanceMap = getExistingAttendanceMap(demoCurrentUser, selectedClassId, selectedDate);
  const monthlyReport = getMonthlyAttendanceReport(demoCurrentUser, selectedClassId, selectedMonth);
  const exportRows = getAttendanceExportRows(demoCurrentUser, selectedClassId, selectedMonth);
  const canSave = canTakeAttendance(demoCurrentUser.role);
  const canEdit = canEditAttendance(demoCurrentUser.role);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Attendance"
        title="Attendance Register"
        description="Take class attendance, prevent duplicate daily records, and review monthly patterns."
      />

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Select name="classId" label="Class" defaultValue={selectedClassId} options={classes.map((item) => [item.id, item.name])} />
          <DateInput name="date" label="Date" defaultValue={selectedDate} />
          <button className="self-end rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-moss">Load Register</button>
        </form>
      </section>

      {params?.saved ? (
        <div className="rounded-lg border border-[#b9dfac] bg-[#e8f3dc] p-4 text-sm font-semibold text-[#315933]">
          Attendance ready to save for {params.saved} students. Database persistence can be connected to this server action.
        </div>
      ) : null}

      {params?.duplicate ? (
        <div className="rounded-lg border border-[#f2b9af] bg-[#ffe4df] p-4 text-sm font-semibold text-[#8b2b20]">
          Duplicate attendance rows were detected for the same student, date, and class.
        </div>
      ) : null}

      <form action={saveAttendanceBulk} className="rounded-lg border border-line bg-white shadow-soft">
        <input type="hidden" name="classId" value={selectedClassId} />
        <input type="hidden" name="date" value={selectedDate} />

        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Daily Register</h2>
            <p className="mt-1 text-sm text-moss">
              {students.length} active students | {canEdit ? "School admin edit mode" : "Role-limited attendance mode"}
            </p>
          </div>
          {canSave ? (
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-clay px-4 py-3 text-sm font-bold text-white hover:bg-[#9c5736]">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Attendance
            </button>
          ) : null}
        </div>

        <div className="divide-y divide-line">
          {students.map((student) => {
            const existing = attendanceMap.get(student.id);
            const defaultStatus = existing?.status || "PRESENT";

            return (
              <article key={student.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(360px,1.1fr)_minmax(220px,0.7fr)] lg:items-center">
                <input type="hidden" name="studentId" value={student.id} />
                <div className="flex items-center gap-3">
                  <StudentPhoto student={student} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{student.preferredName || student.legalName}</p>
                    <p className="text-xs text-moss">{student.studentNumber} | {student.className}</p>
                  </div>
                </div>

                <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <legend className="sr-only">Status for {student.preferredName || student.legalName}</legend>
                  {attendanceStatuses.map((status) => (
                    <label key={status} className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-xs font-bold ${attendanceStatusStyles[status]}`}>
                      <input className="sr-only peer" type="radio" name={`status-${student.id}`} value={status} defaultChecked={defaultStatus === status} disabled={!canSave} />
                      <span>{formatEnumLabel(status)}</span>
                    </label>
                  ))}
                </fieldset>

                <label>
                  <span className="sr-only">Note for {student.preferredName || student.legalName}</span>
                  <input
                    name={`note-${student.id}`}
                    defaultValue={existing?.note}
                    disabled={!canSave}
                    placeholder="Optional note"
                    className="w-full rounded-md border border-line bg-rice px-3 py-3 text-sm text-ink outline-none ring-clay/20 placeholder:text-moss/60 focus:ring-4 disabled:opacity-65"
                  />
                </label>
              </article>
            );
          })}
        </div>

        {students.length === 0 ? <div className="p-8 text-center text-sm text-moss">No students are available for this class and role.</div> : null}
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Monthly Attendance Report</h2>
            <p className="mt-1 text-sm text-moss">Review recorded attendance by month, then export for reports.</p>
          </div>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="classId" value={selectedClassId} />
            <input type="hidden" name="date" value={selectedDate} />
            <DateInput type="month" name="month" label="Month" defaultValue={selectedMonth} />
            <button className="rounded-md border border-line bg-rice px-4 py-3 text-sm font-bold text-ink hover:bg-white">Update</button>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/dashboard/attendance/export/pdf?classId=${selectedClassId}&month=${selectedMonth}`}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-moss"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export PDF
          </a>
          <a
            href={`/dashboard/attendance/export/excel?classId=${selectedClassId}&month=${selectedMonth}`}
            className="inline-flex items-center gap-2 rounded-md border border-ink px-4 py-3 text-sm font-bold text-ink hover:bg-rice"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Excel
          </a>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-rice">
              <tr>
                {["Date", "Student", "Class", "Status", "Note"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-moss">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {exportRows.map((row) => (
                <tr key={`${row.date}-${row.studentNumber}`}>
                  <td className="px-4 py-3 text-moss">{row.date}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{row.studentName}</td>
                  <td className="px-4 py-3 text-moss">{row.className}</td>
                  <td className="px-4 py-3 text-moss">{formatEnumLabel(row.status)}</td>
                  <td className="px-4 py-3 text-moss">{row.note || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {monthlyReport.length === 0 ? <div className="p-6 text-center text-sm text-moss">No attendance records for this month.</div> : null}
        </div>
      </section>
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-2 h-11 w-full rounded-md border border-line bg-rice px-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4">
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({
  name,
  label,
  defaultValue,
  type = "date"
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: "date" | "month";
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="mt-2 h-11 w-full rounded-md border border-line bg-rice px-3 text-sm text-ink outline-none ring-clay/20 focus:ring-4"
      />
    </label>
  );
}
