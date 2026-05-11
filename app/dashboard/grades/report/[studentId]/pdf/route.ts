import { NextRequest } from "next/server";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getStudentReportCard } from "@/lib/lms";
import { getRequiredCurrentUser } from "@/lib/session";

type ReportContext = { params: Promise<{ studentId: string }> };

export async function GET(_request: NextRequest, { params }: ReportContext) {
  const { studentId } = await params;
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  const report = await getStudentReportCard(currentUser, studentId);
  if (!report) return new Response("Not found", { status: 404 });
  const lines = [`${school.name} Report Card`, `${report.student.preferredName || report.student.legalName} (${report.student.studentNumber})`, `Overall: ${report.overall}% - ${report.band}`, "", ...report.rows.map((row) => `${row.subject.name}: ${row.percent ? `${row.percent}%` : "-"} (${row.band})`)];
  return new Response(createSimplePdf(lines), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="report-${report.student.studentNumber}.pdf"` } });
}

function createSimplePdf(lines: string[]) { const escapedLines = lines.slice(0, 34).map((line, index) => { const text = line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)"); const y = 760 - index * 20; return `BT /F1 10 Tf 40 ${y} Td (${text}) Tj ET`; }); const stream = escapedLines.join("\n"); const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]; let pdf = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xrefOffset = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join(""); pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`; return new TextEncoder().encode(pdf); }
