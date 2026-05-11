import { NextRequest } from "next/server";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getStudentReportCard } from "@/lib/lms";
import { createBrandedPdf } from "@/lib/pdf";
import { getRequiredCurrentUser } from "@/lib/session";

type ReportContext = { params: Promise<{ studentId: string }> };

export async function GET(_request: NextRequest, { params }: ReportContext) {
  const { studentId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  const report = await getStudentReportCard(currentUser, studentId);
  if (!report) return new Response("Not found", { status: 404 });

  const studentName = report.student.preferredName || report.student.legalName;

  return new Response(
    createBrandedPdf({
      school,
      title: `${studentName} Report Card`,
      documentType: "Student Report",
      subtitle: report.parentSummary,
      summary: [
        { label: "Overall", value: `${report.overall}%`, tone: report.overall >= 70 ? "success" : report.overall >= 50 ? "warning" : "error" },
        { label: "Progress Band", value: report.band, tone: "info" },
        { label: "Subjects", value: report.rows.length, tone: "default" }
      ],
      sections: [
        {
          title: "Student Details",
          lines: [
            `Name: ${studentName}`,
            `Student number: ${report.student.studentNumber}`,
            `Class: ${report.student.className || "Not enrolled"}`
          ]
        }
      ],
      table: {
        columns: ["Subject", "Assignments", "Exams", "Average", "Band"],
        widths: [170, 85, 70, 75, 107],
        rows: report.rows.map((row) => [row.subject.name, row.assignmentCount, row.examCount, row.percent ? `${row.percent}%` : "-", row.band])
      }
    }),
    {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${report.student.studentNumber}.pdf"`
      }
    }
  );
}
