/**
 * lib/audit.ts — Audit logging
 * ─────────────────────────────
 * Writes to the SensitiveAuditLog table in the database.
 * All sensitive operations (student data access, auth events, school
 * management, exports) must call an audit function from this module.
 *
 * Guarantees:
 *   - Audit entries NEVER contain raw sensitive data (no PII values)
 *   - Resource IDs and actor IDs are stored — not the resource content
 *   - Failures are logged to stderr but never crash the calling code
 *   - Tenant isolation: every entry is scoped to a schoolId
 *
 * Usage:
 *   import { audit } from "@/lib/audit";
 *   await audit.studentViewed(user, student.id, student.schoolId);
 *   await audit.loginFailed(email, schoolId, ip);
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { AppUser } from "@/lib/types";

/**
 * Audit action constants.
 *
 * These mirror the SensitiveAuditAction enum in prisma/schema.prisma.
 * After running `npx prisma generate` the generated client will export
 * the same values — this local definition keeps the app typesafe until
 * the migration has been applied.
 *
 * Run `npx prisma migrate dev` to apply the updated schema, then
 * `npx prisma generate` to regenerate the client.
 */
export const SensitiveAuditAction = {
  VIEW: "VIEW",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  EXPORT: "EXPORT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  SCHOOL_CREATED: "SCHOOL_CREATED",
  SCHOOL_UPDATED: "SCHOOL_UPDATED",
  ADMIN_CREATED: "ADMIN_CREATED",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGO_UPDATED: "LOGO_UPDATED",
} as const;

export type SensitiveAuditAction = typeof SensitiveAuditAction[keyof typeof SensitiveAuditAction];

// ── Core write function ───────────────────────────────────────────────────────

interface AuditEntry {
  schoolId: string;
  actorId?: string | null;
  studentId?: string | null;
  action: SensitiveAuditAction;
  resourceType: string;
  resourceId: string;
  /** Safe metadata — must NEVER contain PII or secret values */
  metadata?: Record<string, unknown>;
}

/**
 * Writes one audit entry. Never throws — failures are logged to stderr.
 * Calling code must NOT await this in a transaction that could roll back,
 * as audit entries should persist even if the primary operation fails.
 */
async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  try {
    await db.sensitiveAuditLog.create({
      data: {
        schoolId: entry.schoolId,
        actorId: entry.actorId ?? null,
        studentId: entry.studentId ?? null,
        // Cast through unknown: Prisma Json accepts plain objects at runtime,
        // but the generated type is strict until `prisma generate` is rerun
        // after the schema migration is applied.
        action: entry.action as never,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: (entry.metadata ?? {}) as never,
      },
    });
  } catch (err) {
    // Audit writes must never crash the application.
    // Log to stderr and continue.
    logger.error("Audit log write failed", {
      error: err,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
    });
  }
}

// ── Public audit API ──────────────────────────────────────────────────────────

export const audit = {
  // ── Authentication events ─────────────────────────────────────────────────

  async loginSuccess(user: AppUser, metadata?: { ip?: string; userAgent?: string }): Promise<void> {
    await writeAuditEntry({
      schoolId: user.schoolId ?? "super-admin",
      actorId: user.id,
      action: SensitiveAuditAction.LOGIN,
      resourceType: "session",
      resourceId: user.id,
      metadata: { ip: metadata?.ip, userAgent: metadata?.userAgent },
    });
  },

  async loginFailed(
    email: string,
    schoolId: string,
    metadata?: { ip?: string; reason?: string }
  ): Promise<void> {
    // Hash the email so we can correlate without storing the PII
    const emailHash = await hashIdentifier(email);
    await writeAuditEntry({
      schoolId,
      action: SensitiveAuditAction.LOGIN_FAILED,
      resourceType: "session",
      resourceId: emailHash,
      metadata: { ip: metadata?.ip, reason: metadata?.reason },
    });
  },

  async logout(user: AppUser): Promise<void> {
    await writeAuditEntry({
      schoolId: user.schoolId ?? "super-admin",
      actorId: user.id,
      action: SensitiveAuditAction.LOGOUT,
      resourceType: "session",
      resourceId: user.id,
    });
  },

  // ── Student data access ───────────────────────────────────────────────────

  async studentViewed(user: AppUser, studentId: string, schoolId: string): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      studentId,
      action: SensitiveAuditAction.VIEW,
      resourceType: "student",
      resourceId: studentId,
    });
  },

  async studentCreated(user: AppUser, studentId: string, schoolId: string): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      studentId,
      action: SensitiveAuditAction.CREATE,
      resourceType: "student",
      resourceId: studentId,
    });
  },

  async studentUpdated(user: AppUser, studentId: string, schoolId: string, fields?: string[]): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      studentId,
      action: SensitiveAuditAction.UPDATE,
      resourceType: "student",
      resourceId: studentId,
      metadata: { changedFields: fields ?? [] },
    });
  },

  async sensitiveDocumentViewed(
    user: AppUser,
    studentId: string,
    schoolId: string,
    documentType: string
  ): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      studentId,
      action: SensitiveAuditAction.VIEW,
      resourceType: "sensitive_document",
      resourceId: studentId,
      metadata: { documentType },
    });
  },

  async dataExported(
    user: AppUser,
    schoolId: string,
    resourceType: string,
    recordCount: number
  ): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action: SensitiveAuditAction.EXPORT,
      resourceType,
      resourceId: schoolId,
      metadata: { recordCount },
    });
  },

  // ── School management ─────────────────────────────────────────────────────

  async schoolCreated(user: AppUser, schoolId: string, schoolName: string): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action: SensitiveAuditAction.SCHOOL_CREATED,
      resourceType: "school",
      resourceId: schoolId,
      metadata: { schoolName },
    });
  },

  async schoolUpdated(user: AppUser, schoolId: string, changedFields?: string[]): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action: SensitiveAuditAction.SCHOOL_UPDATED,
      resourceType: "school",
      resourceId: schoolId,
      metadata: { changedFields: changedFields ?? [] },
    });
  },

  async schoolLogoUpdated(user: AppUser, schoolId: string): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action: SensitiveAuditAction.LOGO_UPDATED,
      resourceType: "school_logo",
      resourceId: schoolId,
    });
  },

  async adminCreated(user: AppUser, newAdminId: string, schoolId: string): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action: SensitiveAuditAction.ADMIN_CREATED,
      resourceType: "user",
      resourceId: newAdminId,
    });
  },

  // ── Access control ────────────────────────────────────────────────────────

  async permissionDenied(
    user: AppUser | null,
    resourceType: string,
    resourceId: string,
    schoolId: string,
    reason?: string
  ): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user?.id ?? null,
      action: SensitiveAuditAction.PERMISSION_DENIED,
      resourceType,
      resourceId,
      metadata: { reason },
    });
  },

  // ── Generic helpers ───────────────────────────────────────────────────────

  async record(
    user: AppUser,
    action: SensitiveAuditAction,
    resourceType: string,
    resourceId: string,
    schoolId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await writeAuditEntry({
      schoolId,
      actorId: user.id,
      action,
      resourceType,
      resourceId,
      metadata,
    });
  },
};

// ── Audit log queries (for the super-admin audit viewer) ──────────────────────

export async function getAuditLogsForSchool(
  schoolId: string,
  options: { limit?: number; offset?: number; actorId?: string; resourceType?: string } = {}
) {
  const { limit = 50, offset = 0, actorId, resourceType } = options;
  try {
    return await db.sensitiveAuditLog.findMany({
      where: {
        schoolId,
        ...(actorId && { actorId }),
        ...(resourceType && { resourceType }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        actor: { select: { id: true, name: true, role: true } },
      },
    });
  } catch {
    return [];
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * One-way hash for an identifier (e.g. email) so we can correlate
 * failed login attempts without storing PII.
 */
async function hashIdentifier(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "sha256:" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
