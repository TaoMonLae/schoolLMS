import { NextRequest } from "next/server";
import { demoSchoolBranding } from "@/lib/branding";
import { demoCurrentUser } from "@/lib/students";
import { getStudentReportCard } from "@/lib/lms";

type Context = { params: Promise<{ studentId: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { studentId } = await params;
  const report = getStudentReportCard(demoCurrentUser, studentId);
  if (!report) return new Response("Not found", { status: 404 });
  const lines = [
    `${demoSchoolBranding.name} Report Card`,
    `${report.student.preferredName || report.student.legalName} (${report.student.studentNumber})`,
    `Overall: ${report.overall}% - ${report.band}`,
    "",
    "Subject | Grade | Progress",
    ...report.rows.map((row) => `${row.subject.name} | ${row.percent ? `${row.percent}%` : "-"} | ${row.band}`),
    "",
    `Parent Summary: ${report.parentSummary}`
  ];
  return new Response(createPdf(lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-card-${report.student.studentNumber}.pdf"`
    }
  });
}

function createPdf(lines: string[]) {
  const stream = lines.slice(0, 36).map((line, index) => {
    const text = line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    return `BT /F1 10 Tf 40 ${760 - index * 19} Td (${text}) Tj ET`;
  }).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
