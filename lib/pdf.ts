import type { SchoolSummary } from "@/lib/types";

const PAGE = { width: 595, height: 842 };

const THEME = {
  primary: "#5645d4",
  navy: "#0a1530",
  navyMid: "#1a2a52",
  canvas: "#ffffff",
  surface: "#f6f5f4",
  surfaceSoft: "#fafaf9",
  hairline: "#e5e3df",
  hairlineStrong: "#c8c4be",
  ink: "#1a1a1a",
  slate: "#5d5b54",
  muted: "#a4a097",
  success: "#1aae39",
  warning: "#dd5b00",
  error: "#e03131",
  tintMint: "#d9f3e1",
  tintYellow: "#fef7d6",
  tintRose: "#fde0ec",
  tintSky: "#dcecfa",
  tintLavender: "#e6e0f5"
};

type PdfCell = string | number | null | undefined;

type PdfTable = {
  columns: string[];
  rows: PdfCell[][];
  widths?: number[];
};

type PdfSummary = {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "error" | "info";
};

export type BrandedPdfOptions = {
  school: Pick<SchoolSummary, "name" | "shortName" | "logoUrl" | "primaryColor" | "address" | "phone" | "email" | "city" | "country">;
  title: string;
  documentType: string;
  subtitle?: string;
  generatedAt?: Date;
  summary?: PdfSummary[];
  sections?: { title: string; lines: string[] }[];
  table?: PdfTable;
};

export function createBrandedPdf(options: BrandedPdfOptions) {
  const generatedAt = options.generatedAt ?? new Date();
  const generatedDate = formatDate(generatedAt);
  const generatedDateTime = formatDateTime(generatedAt);
  const commands: string[] = [color(THEME.canvas), rect(0, 0, PAGE.width, PAGE.height, "f")];
  const schoolName = options.school.name || "Mon Refugee Learning Centre";
  const shortName = options.school.shortName || initials(schoolName) || "Mon RLC";

  drawHeader(commands, { ...options, generatedDate, schoolName, shortName });
  let y = 682;

  if (options.subtitle) {
    commands.push(text(options.subtitle, 44, y, 10, THEME.slate, "F1"));
    y -= 24;
  }

  if (options.summary?.length) {
    y = drawSummary(commands, options.summary, y);
  }

  if (options.sections?.length) {
    for (const section of options.sections) {
      y = drawSection(commands, section.title, section.lines, y);
    }
  }

  if (options.table) {
    drawTable(commands, options.table, y);
  }

  drawFooter(commands, schoolName, generatedDateTime);
  return buildPdf(commands.join("\n"));
}

function drawHeader(commands: string[], options: BrandedPdfOptions & { generatedDate: string; schoolName: string; shortName: string }) {
  commands.push(color(THEME.navy), rect(0, 786, PAGE.width, 56, "f"));
  commands.push(color(THEME.primary), rect(0, 778, PAGE.width, 8, "f"));
  commands.push(color(THEME.canvas), rect(32, 704, 531, 92, "f"));
  commands.push(stroke(THEME.hairline), rect(32, 704, 531, 92, "S"));
  commands.push(color(THEME.surface), rect(44, 722, 54, 54, "f"));
  commands.push(stroke(THEME.hairlineStrong), rect(44, 722, 54, 54, "S"));
  commands.push(color(options.school.primaryColor || THEME.primary), rect(50, 728, 42, 42, "f"));
  commands.push(text(options.shortName.slice(0, 7), 55, 746, 10, THEME.canvas, "F2"));
  commands.push(text(options.schoolName, 112, 758, 16, THEME.ink, "F2"));
  commands.push(text("School Management & Learning System", 112, 739, 9, THEME.slate, "F1"));
  const contact = [options.school.city, options.school.country].filter(Boolean).join(", ") || options.school.email || options.school.phone || "CampusBloom";
  commands.push(text(contact, 112, 724, 8, THEME.muted, "F1"));
  commands.push(text(options.documentType, 392, 758, 10, THEME.primary, "F2"));
  commands.push(text(options.title, 392, 740, 14, THEME.ink, "F2"));
  commands.push(text(`Generated ${options.generatedDate}`, 392, 724, 8, THEME.slate, "F1"));
}

function drawSummary(commands: string[], items: PdfSummary[], y: number) {
  const gap = 10;
  const width = Math.floor((507 - gap * (items.length - 1)) / items.length);
  items.slice(0, 4).forEach((item, index) => {
    const x = 44 + index * (width + gap);
    const tone = toneColors(item.tone);
    commands.push(color(tone.bg), rect(x, y - 48, width, 48, "f"));
    commands.push(stroke(tone.border), rect(x, y - 48, width, 48, "S"));
    commands.push(text(String(item.label).toUpperCase(), x + 10, y - 17, 7, THEME.slate, "F2"));
    commands.push(text(String(item.value), x + 10, y - 36, 16, tone.fg, "F2"));
  });
  return y - 70;
}

function drawSection(commands: string[], title: string, lines: string[], y: number) {
  const height = 34 + Math.max(lines.length, 1) * 14;
  commands.push(color(THEME.surfaceSoft), rect(44, y - height, 507, height, "f"));
  commands.push(stroke(THEME.hairline), rect(44, y - height, 507, height, "S"));
  commands.push(text(title, 58, y - 20, 11, THEME.ink, "F2"));
  lines.slice(0, 6).forEach((line, index) => commands.push(text(line, 58, y - 40 - index * 14, 9, THEME.slate, "F1")));
  return y - height - 16;
}

function drawTable(commands: string[], table: PdfTable, y: number) {
  const x = 44;
  const tableWidth = 507;
  const widths = table.widths?.length === table.columns.length ? table.widths : table.columns.map(() => tableWidth / table.columns.length);
  const rowHeight = 24;
  const headerHeight = 28;
  commands.push(color(THEME.navy), rect(x, y - headerHeight, tableWidth, headerHeight, "f"));
  let cx = x;
  table.columns.forEach((column, index) => {
    commands.push(text(column, cx + 7, y - 18, 8, THEME.canvas, "F2"));
    cx += widths[index];
  });
  let cy = y - headerHeight;
  table.rows.slice(0, 22).forEach((row, rowIndex) => {
    cy -= rowHeight;
    commands.push(color(rowIndex % 2 === 0 ? THEME.canvas : THEME.surfaceSoft), rect(x, cy, tableWidth, rowHeight, "f"));
    commands.push(stroke(THEME.hairline), rect(x, cy, tableWidth, rowHeight, "S"));
    let cellX = x;
    row.forEach((cell, cellIndex) => {
      commands.push(text(truncate(String(cell ?? "-"), Math.max(10, Math.floor(widths[cellIndex] / 5))), cellX + 7, cy + 9, 8, THEME.ink, "F1"));
      cellX += widths[cellIndex];
    });
  });
}

function drawFooter(commands: string[], schoolName: string, generatedDateTime: string) {
  commands.push(stroke(THEME.hairline), `36 54 m 559 54 l S`);
  commands.push(text(`${schoolName} • Generated by CampusBloom`, 44, 34, 8, THEME.slate, "F1"));
  commands.push(text(`${generatedDateTime} • Page 1`, 430, 34, 8, THEME.slate, "F1"));
}

function toneColors(tone: PdfSummary["tone"]) {
  if (tone === "success") return { bg: THEME.tintMint, border: "#b9dfac", fg: THEME.success };
  if (tone === "warning") return { bg: THEME.tintYellow, border: "#f0d38a", fg: THEME.warning };
  if (tone === "error") return { bg: THEME.tintRose, border: "#f2b9af", fg: THEME.error };
  if (tone === "info") return { bg: THEME.tintSky, border: "#bfd5f7", fg: THEME.primary };
  return { bg: THEME.tintLavender, border: "#d6b6f6", fg: THEME.primary };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]?.toUpperCase()).join("");
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1))}…` : value;
}

function color(hex: string) {
  const { r, g, b } = rgb(hex);
  return `${r} ${g} ${b} rg`;
}

function stroke(hex: string) {
  const { r, g, b } = rgb(hex);
  return `${r} ${g} ${b} RG`;
}

function rect(x: number, y: number, width: number, height: number, op: "f" | "S") {
  return `${x} ${y} ${width} ${height} re ${op}`;
}

function text(value: string, x: number, y: number, size: number, hex: string, font = "F1") {
  return `${color(hex)} BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function escapePdf(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function rgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : THEME.primary;
  return {
    r: parseInt(normalized.slice(1, 3), 16) / 255,
    g: parseInt(normalized.slice(3, 5), 16) / 255,
    b: parseInt(normalized.slice(5, 7), 16) / 255
  };
}

function buildPdf(stream: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
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
