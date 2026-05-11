import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, SensitiveAuditAction } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { tenantFilter, TenantAccessError } from "@/lib/tenant";
import { AppUser } from "@/lib/types";

const BCRYPT_ROUNDS = (() => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
  return Number.isFinite(rounds) && rounds >= 10 && rounds <= 14 ? rounds : 12;
})();

export type UserFilters = { q?: string; role?: Role | "ALL"; active?: "ALL" | "active" | "inactive"; schoolId?: string };
export type ManagedUser = { id: string; schoolId?: string; schoolName?: string; name: string; email: string; role: Role; isActive: boolean; caseManagerApproved: boolean; classIds: string[]; studentId?: string; studentName?: string; createdAt: string };
export type UserFormInput = { schoolId?: string; name: string; email: string; role: Role; password?: string; isActive?: boolean; caseManagerApproved?: boolean; classIds?: string[]; studentId?: string };

export function canAccessUserManagement(user: AppUser) {
  return hasPermission(user.role, "users:manage");
}

export function assignableRolesFor(user: AppUser): Role[] {
  if (user.role === "SUPER_ADMIN") return ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "CASE_MANAGER", "STUDENT"];
  if (user.role === "SCHOOL_ADMIN") return ["SCHOOL_ADMIN", "TEACHER", "CASE_MANAGER", "STUDENT"];
  return [];
}

export function assertCanManageUsers(user: AppUser) {
  if (!canAccessUserManagement(user)) throw new TenantAccessError("You do not have permission to manage users");
}

function assertRoleAllowed(actor: AppUser, targetRole: Role) {
  if (!assignableRolesFor(actor).includes(targetRole)) throw new TenantAccessError("Cannot assign this role");
}

export function resolveManagedSchoolId(actor: AppUser, requestedSchoolId?: string | null, role?: Role) {
  if (role === "SUPER_ADMIN") return null;
  if (actor.role === "SUPER_ADMIN") {
    if (!requestedSchoolId) throw new TenantAccessError("SUPER_ADMIN must choose a school for school-scoped users");
    return requestedSchoolId;
  }
  if (!actor.schoolId) throw new TenantAccessError("User has no assigned school");
  if (requestedSchoolId && requestedSchoolId !== actor.schoolId) throw new TenantAccessError("Cannot manage users in another school");
  return actor.schoolId;
}

function userWhere(actor: AppUser, filters: UserFilters = {}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = actor.role === "SUPER_ADMIN" ? {} : tenantFilter(actor);
  if (actor.role === "SUPER_ADMIN" && filters.schoolId && filters.schoolId !== "ALL") where.schoolId = filters.schoolId;
  if (filters.role && filters.role !== "ALL") where.role = filters.role;
  if (filters.active === "active") where.isActive = true;
  if (filters.active === "inactive") where.isActive = false;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  }
  return where;
}

export async function getManagedUsers(actor: AppUser, filters: UserFilters = {}): Promise<ManagedUser[]> {
  assertCanManageUsers(actor);
  const users = await db.user.findMany({
    where: userWhere(actor, filters),
    include: { school: { select: { name: true } }, classes: { select: { id: true } }, student: { select: { id: true, preferredName: true, legalName: true } } },
    orderBy: [{ schoolId: "asc" }, { role: "asc" }, { name: "asc" }]
  });
  return users.map((user) => ({
    id: user.id,
    schoolId: user.schoolId || undefined,
    schoolName: user.school?.name,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    caseManagerApproved: user.caseManagerApproved,
    classIds: user.classes.map((item) => item.id),
    studentId: user.student?.id,
    studentName: user.student ? user.student.preferredName || user.student.legalName || user.student.id : undefined,
    createdAt: user.createdAt.toISOString().slice(0, 10)
  }));
}

export async function getManagedUser(actor: AppUser, id: string) {
  const user = await db.user.findFirst({ where: { id, ...userWhere(actor) }, include: { classes: { select: { id: true } }, student: { select: { id: true, preferredName: true, legalName: true } }, school: { select: { name: true } } } });
  if (!user) return null;
  return (await getManagedUsers(actor, { schoolId: actor.role === "SUPER_ADMIN" ? user.schoolId || "ALL" : undefined })).find((item) => item.id === id) || null;
}

export async function getUserManagementOptions(actor: AppUser, schoolId?: string) {
  assertCanManageUsers(actor);
  const schoolFilter = actor.role === "SUPER_ADMIN" ? (schoolId ? { schoolId } : {}) : tenantFilter(actor);
  const [schools, classes, students] = await Promise.all([
    actor.role === "SUPER_ADMIN" ? db.school.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
    db.class.findMany({ where: schoolFilter, orderBy: [{ academicYear: "desc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.student.findMany({ where: { ...schoolFilter, deletedAt: null }, orderBy: [{ studentNumber: "asc" }], select: { id: true, studentNumber: true, legalName: true, preferredName: true, userId: true, schoolId: true } })
  ]);
  return { schools, classes, students, roles: assignableRolesFor(actor) };
}

export async function createManagedUser(actor: AppUser, input: UserFormInput) {
  assertCanManageUsers(actor);
  assertRoleAllowed(actor, input.role);
  const schoolId = resolveManagedSchoolId(actor, input.schoolId, input.role);
  if (input.role === "STUDENT" && !input.studentId) throw new TenantAccessError("Student user accounts must be linked to a student record");
  const passwordHash = await bcrypt.hash(input.password || temporaryPassword(), BCRYPT_ROUNDS);
  const created = await db.user.create({ data: { schoolId, name: input.name, email: input.email.toLowerCase(), role: input.role, passwordHash, isActive: input.isActive ?? true, caseManagerApproved: input.role === "CASE_MANAGER" ? input.caseManagerApproved === true : false } });
  await applyLinks(actor, created.id, schoolId, input.classIds || [], input.studentId || null, input.role);
  await audit.record(actor, SensitiveAuditAction.CREATE, "user", created.id, schoolId || "super-admin", { role: input.role });
  return created;
}

export async function updateManagedUser(actor: AppUser, id: string, input: UserFormInput) {
  assertCanManageUsers(actor);
  assertRoleAllowed(actor, input.role);
  const existing = await db.user.findFirst({ where: { id, ...userWhere(actor) } });
  if (!existing) throw new TenantAccessError("User not found");
  if (actor.role !== "SUPER_ADMIN" && existing.role === "SUPER_ADMIN") throw new TenantAccessError("Cannot modify super admins");
  const schoolId = resolveManagedSchoolId(actor, input.schoolId ?? existing.schoolId, input.role);
  if (input.role === "STUDENT" && !input.studentId) throw new TenantAccessError("Student user accounts must be linked to a student record");
  const updated = await db.user.update({ where: { id }, data: { schoolId, name: input.name, email: input.email.toLowerCase(), role: input.role, isActive: input.isActive ?? true, caseManagerApproved: input.role === "CASE_MANAGER" ? input.caseManagerApproved === true : false } });
  await applyLinks(actor, id, schoolId, input.classIds || [], input.studentId || null, input.role);
  await audit.record(actor, SensitiveAuditAction.UPDATE, "user", id, schoolId || existing.schoolId || "super-admin", { role: input.role, active: input.isActive });
  return updated;
}

export async function setManagedUserActive(actor: AppUser, id: string, isActive: boolean) {
  const existing = await db.user.findFirst({ where: { id, ...userWhere(actor) } });
  if (!existing) throw new TenantAccessError("User not found");
  if (actor.role !== "SUPER_ADMIN" && existing.role === "SUPER_ADMIN") throw new TenantAccessError("Cannot modify super admins");
  await db.user.update({ where: { id }, data: { isActive } });
  await audit.record(actor, SensitiveAuditAction.UPDATE, "user", id, existing.schoolId || "super-admin", { isActive });
}

export async function resetManagedUserPassword(actor: AppUser, id: string, password: string) {
  const existing = await db.user.findFirst({ where: { id, ...userWhere(actor) } });
  if (!existing) throw new TenantAccessError("User not found");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db.user.update({ where: { id }, data: { passwordHash } });
  await audit.record(actor, SensitiveAuditAction.PASSWORD_RESET, "user", id, existing.schoolId || "super-admin", { bcrypt: passwordHash.startsWith("$2") });
  return passwordHash;
}

async function applyLinks(actor: AppUser, userId: string, schoolId: string | null, classIds: string[], studentId: string | null, role: Role) {
  await db.user.update({ where: { id: userId }, data: { classes: { set: [] } } });
  if (role === "TEACHER" && classIds.length > 0) {
    const validClasses = await db.class.findMany({ where: { id: { in: classIds }, schoolId: schoolId || "__none__" }, select: { id: true } });
    await db.user.update({ where: { id: userId }, data: { classes: { connect: validClasses.map((item) => ({ id: item.id })) } } });
  }
  const linkedStudent = await db.student.findUnique({ where: { userId } });
  if (linkedStudent && linkedStudent.id !== studentId) await db.student.update({ where: { id: linkedStudent.id }, data: { userId: null } });
  if (role === "STUDENT" && studentId) {
    const student = await db.student.findFirst({ where: { id: studentId, schoolId: schoolId || "__none__", deletedAt: null } });
    if (!student) throw new TenantAccessError("Student must belong to the same school");
    await db.student.update({ where: { id: studentId }, data: { userId } });
    await audit.record(actor, SensitiveAuditAction.UPDATE, "student_user_link", studentId, student.schoolId, { linkedUserId: userId });
  }
}

function temporaryPassword() {
  return `Temp-${Math.random().toString(36).slice(2, 10)}!`;
}
