import { NextRequest } from "next/server";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getAttendanceClassesForUser, getAttendanceExportRows } from "@/lib/attendance";
import { createBrandedPdf } from "@/lib/pdf";
import { getRequiredCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  const classes = await getAttendanceClassesForUser(currentUser);
  const classId = request.nextUrl.searchParams.get("classId") || classes[0]?.id || "";
  const selectedClass = classes.find((classItem) => classItem.id === classId);
  const month = request.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const rows = await getAttendanceExportRows(currentUser, classId, month);
  const present = rows.filter((row) => row.status === "PRESENT").length;
  const late = rows.filter((row) => row.status === "LATE").length;
  const absent = rows.filter((row) => row.status === "ABSENT").length;
  const excused = rows.filter((row) => row.status === "EXCUSED").length;

  return new Response(
    createBrandedPdf({
      school,
      title: `${selectedClass?.name || "Class"} Attendance`,
      documentType: "Attendance Report",
      subtitle: `Monthly attendance register for ${month}.`,
      summary: [
        { label: "Records", value: rows.length, tone: "info" },
        { label: "Present", value: present + late, tone: "success" },
        { label: "Absent", value: absent, tone: "error" },
        { label: "Excused", value: excused, tone: "warning" }
      ],
      sections: [
        { title: "Report Scope", lines: [`Class: ${selectedClass?.name || "All available classes"}`, `Month: ${month}`, `Late arrivals: ${late}`] }
      ],
      table: {
        columns: ["Date", "Student", "Class", "Status", "Note"],
        widths: [70, 135, 125, 75, 102],
        rows: rows.map((row) => [row.date, row.studentName || row.studentNumber, row.className, row.status, row.note || "-"])
      }
    }),
    {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attendance-${month}.pdf"`
      }
    }
  );
}
