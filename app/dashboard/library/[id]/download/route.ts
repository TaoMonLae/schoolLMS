import { NextRequest } from "next/server";
import { getLibraryBookForUser, isLibraryFileUrlAllowed } from "@/lib/library";
import { demoCurrentUser } from "@/lib/students";

type DownloadRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: DownloadRouteContext) {
  const { id } = await params;
  const book = getLibraryBookForUser(demoCurrentUser, id);

  if (!book || !isLibraryFileUrlAllowed(demoCurrentUser, book, book.fileUrl)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(createDemoPdf(book.title), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugify(book.title)}.pdf"`,
      "X-School-Scope": book.schoolId
    }
  });
}

function createDemoPdf(title: string) {
  const safeTitle = title.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT /F1 18 Tf 72 720 Td (${safeTitle}) Tj ET\nBT /F1 11 Tf 72 690 Td (Demo E-Library file. Connect object storage for real uploads.) Tj ET`;
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
