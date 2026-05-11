import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { FILE_SIZE_LIMITS, sanitizeFileName, validateUploadedFile } from "@/lib/upload-validation";

const LOGO_MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg"
};

export type StoredLogo = { url: string; contentType: string; size: number };
export type LogoValidationResult = { valid: true; contentType: string } | { valid: false; error: string };

export function validateSchoolLogo(buffer: Buffer, fileName: string, size: number, declaredType: string): LogoValidationResult {
  if (declaredType === "image/svg+xml") return validateSvgLogo(buffer, fileName, size);
  const result = validateUploadedFile(buffer, fileName, size, "logo", declaredType);
  if (!result.valid) return { valid: false, error: result.error ?? "Invalid logo file." };
  if (!result.detectedMimeType || !LOGO_MIME_TO_EXT[result.detectedMimeType]) return { valid: false, error: "Unsupported logo type." };
  return { valid: true, contentType: result.detectedMimeType };
}

export async function storeSchoolLogo(input: { schoolId: string; fileName: string; contentType: string; buffer: Buffer }): Promise<StoredLogo> {
  const adapter = getLogoStorageAdapter();
  return adapter.put(input);
}

export type LogoStorageAdapter = {
  put(input: { schoolId: string; fileName: string; contentType: string; buffer: Buffer }): Promise<StoredLogo>;
};

function getLogoStorageAdapter(): LogoStorageAdapter {
  // Production object storage can replace this factory with an R2/S3/Spaces adapter
  // that implements the same put() contract and returns a public or signed CDN URL.
  return new LocalPublicLogoStorageAdapter();
}

class LocalPublicLogoStorageAdapter implements LogoStorageAdapter {
  async put(input: { schoolId: string; fileName: string; contentType: string; buffer: Buffer }): Promise<StoredLogo> {
    const safeSchoolId = input.schoolId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeSchoolId) throw new Error("Invalid school id for logo storage");

    const extension = LOGO_MIME_TO_EXT[input.contentType];
    if (!extension) throw new Error("Unsupported logo content type");

    const uploadDir = path.join(process.cwd(), "public", "uploads", "schools", safeSchoolId);
    await mkdir(uploadDir, { recursive: true });

    const sanitizedOriginal = sanitizeFileName(input.fileName)?.replace(/\.[^.]+$/, "") ?? "logo";
    const safeBase = sanitizedOriginal.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "logo";
    const objectName = `${Date.now()}-${randomUUID()}-${safeBase}${extension}`;
    const targetPath = path.join(uploadDir, objectName);

    await writeFile(targetPath, input.buffer, { flag: "wx" });

    return {
      url: `/uploads/schools/${safeSchoolId}/${objectName}`,
      contentType: input.contentType,
      size: input.buffer.length
    };
  }
}

function validateSvgLogo(buffer: Buffer, fileName: string, size: number): LogoValidationResult {
  if (size > FILE_SIZE_LIMITS.logo) return { valid: false, error: "File too large. Maximum size for logo is 2 MB." };
  if (size === 0) return { valid: false, error: "File is empty." };
  if (!sanitizeFileName(fileName) || !fileName.toLowerCase().endsWith(".svg")) return { valid: false, error: "SVG logo file name is invalid." };

  const text = buffer.toString("utf8").trim();
  const lower = text.toLowerCase();
  const hasSvgRoot = lower.startsWith("<svg") || (lower.startsWith("<?xml") && lower.includes("<svg"));
  if (!hasSvgRoot) return { valid: false, error: "Could not verify SVG logo content." };
  if (lower.includes("<script") || /\son[a-z]+\s*=/.test(lower) || lower.includes("javascript:")) {
    return { valid: false, error: "SVG logo contains unsafe scripting." };
  }

  return { valid: true, contentType: "image/svg+xml" };
}
