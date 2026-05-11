import { NextRequest } from "next/server";
import { getAttendanceClassesForUser, getAttendanceExportRows } from "@/lib/attendance";
import { demoCurrentUser } from "@/lib/students";

export function GET(request: NextRequest) {
  const classId = request.nextUrl.searchParams.get("classId") || getAttendanceClassesForUser(demoCurrentUser)[0]?.id || "";
  const month = request.nextUrl.searchParams.get("month") || "2026-05";
  const rows = getAttendanceExportRows(demoCurrentUser, classId, month);
  const csv = [
    ["Date", "Student Number", "Student Name", "Class", "Status", "Note"],
    ...rows.map((row) => [row.date, row.studentNumber, row.studentName, row.className, row.status, row.note])
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${month}.xls"`
    }
  });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
