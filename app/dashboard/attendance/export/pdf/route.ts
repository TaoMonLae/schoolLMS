import { NextRequest } from "next/server";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getAttendanceClassesForUser, getAttendanceExportRows } from "@/lib/attendance";
import { getRequiredCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  const classes = await getAttendanceClassesForUser(currentUser);
  const classId = request.nextUrl.searchParams.get("classId") || classes[0]?.id || "";
  const month = request.nextUrl.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const rows = await getAttendanceExportRows(currentUser, classId, month);
  const lines = [
    `${school.name} Attendance Report - ${month}`,
    "",
    "Date        Student        Class              Status     Note",
    ...rows.map((row) => `${row.date}  ${row.studentName.padEnd(13)}  ${row.className.padEnd(17)}  ${row.status.padEnd(8)}  ${row.note}`)
  ];

  return new Response(createSimplePdf(lines), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="attendance-${month}.pdf"`
    }
  });
}

function createSimplePdf(lines: string[]) {
  const escapedLines = lines.slice(0, 34).map((line, index) => {
    const text = line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    const y = 760 - index * 20;

    return `BT /F1 10 Tf 40 ${y} Td (${text}) Tj ET`;
  });
  const stream = escapedLines.join("\n");
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
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}
