/**
 * lib/upload-validation.ts — File upload security
 * ─────────────────────────────────────────────────
 * Validates file uploads beyond the client-declared MIME type by
 * inspecting the file's magic bytes (file signature).
 *
 * Why magic bytes?
 *   A browser sends the MIME type declared by the OS file associations.
 *   An attacker can rename malware.exe to report.pdf and the browser
 *   will send "application/pdf". Magic byte verification catches this.
 *
 * Usage (in a server action):
 *   const file = formData.get("file") as File;
 *   const buffer = Buffer.from(await file.arrayBuffer());
 *   const result = validateUploadedFile(buffer, file.name, file.size, "document");
 *   if (!result.valid) {
 *     return { error: result.error };
 *   }
 */

import { logger } from "@/lib/logger";

// ── Magic byte signatures ─────────────────────────────────────────────────────

interface MagicSignature {
  mimeType: string;
  bytes: number[];
  offset?: number; // byte offset to start matching (default 0)
}

const MAGIC_SIGNATURES: MagicSignature[] = [
  // PDF
  { mimeType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  // JPEG
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP (RIFF....WEBP)
  { mimeType: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF — checked with offset 8 below
  // GIF87a / GIF89a
  { mimeType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  // MP4 (ftyp box at offset 4)
  { mimeType: "video/mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp
  // WebM (EBML header)
  { mimeType: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  // OGG
  { mimeType: "video/ogg", bytes: [0x4f, 0x67, 0x67, 0x53] }, // OggS
];

// ── Size limits (bytes) ───────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS = {
  document: 10 * 1024 * 1024,  // 10 MB
  image: 5 * 1024 * 1024,      // 5 MB
  logo: 2 * 1024 * 1024,       // 2 MB
  video: 500 * 1024 * 1024,    // 500 MB
} as const;

export type UploadCategory = keyof typeof FILE_SIZE_LIMITS;

// ── Allowed MIME types per category ──────────────────────────────────────────

const ALLOWED_MIME_TYPES: Record<UploadCategory, string[]> = {
  document: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  logo: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm", "video/ogg"],
};

// ── Dangerous extension block list ────────────────────────────────────────────

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi", ".dll", ".so",
  ".js", ".ts", ".jsx", ".tsx", ".php", ".py", ".rb", ".pl",
  ".vbs", ".jar", ".class", ".bin", ".com", ".scr", ".hta",
  ".html", ".htm", ".svg", ".xml", ".json", ".csv",
]);

// ── Validation result ─────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  detectedMimeType?: string;
  error?: string;
}

// ── Core validator ────────────────────────────────────────────────────────────

/**
 * Validates an uploaded file buffer for:
 *   1. File size within the category limit
 *   2. File extension not in the blocked list
 *   3. Declared MIME type is in the allowed list for the category
 *   4. Magic bytes match the declared MIME type
 *
 * @param buffer    The file contents as a Buffer or Uint8Array
 * @param fileName  Original file name (used for extension check)
 * @param sizeBytes Declared file size in bytes
 * @param category  Upload category (document, image, logo, video)
 * @param declaredMimeType  MIME type declared by the client
 */
export function validateUploadedFile(
  buffer: Buffer | Uint8Array,
  fileName: string,
  sizeBytes: number,
  category: UploadCategory,
  declaredMimeType: string
): FileValidationResult {
  // 1. Size check
  const maxSize = FILE_SIZE_LIMITS[category];
  if (sizeBytes > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${category} is ${formatBytes(maxSize)}.`,
    };
  }

  if (sizeBytes === 0) {
    return { valid: false, error: "File is empty." };
  }

  // 2. Extension check
  const ext = getExtension(fileName).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    logger.security("Blocked dangerous file extension", { fileName, ext, category });
    return { valid: false, error: `File type .${ext} is not permitted.` };
  }

  // 3. Filename sanitization check — prevent path traversal
  const sanitized = sanitizeFileName(fileName);
  if (!sanitized) {
    return { valid: false, error: "File name is invalid." };
  }

  // 4. Declared MIME type allowed?
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes.includes(declaredMimeType)) {
    return {
      valid: false,
      error: `File type ${declaredMimeType} is not allowed for ${category} uploads. Allowed: ${allowedTypes.join(", ")}.`,
    };
  }

  // 5. Magic byte verification
  const detectedMimeType = detectMimeType(buffer);
  if (!detectedMimeType) {
    logger.security("Could not detect MIME type from magic bytes", { fileName, declaredMimeType });
    return {
      valid: false,
      error: "Could not verify file type. The file may be corrupt or its type is unsupported.",
    };
  }

  // Normalise video/* types — MP4 variants all have the same ftyp box
  const normalisedDeclared = normaliseMimeType(declaredMimeType);
  const normalisedDetected = normaliseMimeType(detectedMimeType);

  if (normalisedDeclared !== normalisedDetected) {
    logger.security("MIME type mismatch: declared vs detected", {
      fileName,
      declared: declaredMimeType,
      detected: detectedMimeType,
    });
    return {
      valid: false,
      detectedMimeType,
      error: `File content does not match the declared type. Detected: ${detectedMimeType}.`,
    };
  }

  return { valid: true, detectedMimeType };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Detects MIME type from the first bytes of a buffer.
 * Returns null if no signature matches.
 */
export function detectMimeType(buffer: Buffer | Uint8Array): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;

    const match = sig.bytes.every(
      (byte, i) => buffer[offset + i] === byte
    );

    if (match) {
      // Special case: WebP needs "WEBP" at offset 8 in addition to "RIFF" at 0
      if (sig.mimeType === "image/webp") {
        if (
          buffer.length >= 12 &&
          buffer[8] === 0x57 && // W
          buffer[9] === 0x45 && // E
          buffer[10] === 0x42 && // B
          buffer[11] === 0x50   // P
        ) {
          return "image/webp";
        }
        continue;
      }
      return sig.mimeType;
    }
  }

  return null;
}

/**
 * Returns the file extension including the dot, e.g. ".pdf"
 */
function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return "." + parts[parts.length - 1];
}

/**
 * Sanitizes a file name by removing path separators and dangerous characters.
 * Returns null if the result is empty.
 */
export function sanitizeFileName(fileName: string): string | null {
  // Remove path components
  const base = fileName.replace(/.*[/\\]/, "");
  // Remove null bytes and control characters
  const sanitized = base.replace(/[\x00-\x1f\x7f]/g, "").trim();
  // Remove leading dots (hidden files on Unix)
  const noHidden = sanitized.replace(/^\.+/, "");
  return noHidden.length > 0 ? noHidden : null;
}

/**
 * Normalises MIME types that have multiple variants to a canonical form.
 */
function normaliseMimeType(mimeType: string): string {
  // All MP4 variants → video/mp4
  if (mimeType.startsWith("video/") && mimeType.includes("mp4")) return "video/mp4";
  return mimeType;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
