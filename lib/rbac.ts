import { Role } from "@/lib/types";

export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  SCHOOL_ADMIN: [
    "school:manage",
    "users:manage",
    "students:manage",
    "students:documents:read",
    "students:documents:manage",
    "classes:manage",
    "attendance:manage",
    "library:read",
    "library:upload",
    "videos:read",
    "videos:upload",
    "lms:read",
    "lms:manage",
    "grades:read",
    "grades:manage",
    "branding:manage",
    "support:read",
    "support:manage",
    "support:sensitive:read",
    "support:sensitive:manage"
  ],
  TEACHER: ["students:read", "classes:read", "attendance:manage", "library:read", "library:upload", "videos:read", "videos:upload", "lms:read", "lms:manage", "grades:read", "grades:manage", "support:read"],
  STUDENT: ["profile:read", "classes:read", "attendance:read", "library:read", "videos:read", "lms:read", "grades:read"],
  CASE_MANAGER: ["students:read", "students:documents:read", "attendance:read", "cases:manage", "library:read", "videos:read", "lms:read", "grades:read", "support:read", "support:manage"]
};

export function hasPermission(role: Role, permission: string) {
  const permissions = rolePermissions[role];

  return permissions.includes("*") || permissions.includes(permission);
}

export function canManageStudents(role: Role) {
  return hasPermission(role, "students:manage");
}

export function canViewSensitiveStudentDocuments(role: Role) {
  return hasPermission(role, "students:documents:read");
}

export function canManageSensitiveStudentDocuments(role: Role) {
  return hasPermission(role, "students:documents:manage");
}

export function canTakeAttendance(role: Role) {
  return hasPermission(role, "attendance:manage");
}

export function canEditAttendance(role: Role) {
  return role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";
}

export function canViewLibrary(role: Role) {
  return hasPermission(role, "library:read");
}

export function canUploadLibraryBooks(role: Role) {
  return hasPermission(role, "library:upload");
}

export function canViewVideos(role: Role) {
  return hasPermission(role, "videos:read");
}

export function canUploadVideos(role: Role) {
  return hasPermission(role, "videos:upload");
}

export function canManageLms(role: Role) {
  return hasPermission(role, "lms:manage");
}

export function canManageGrades(role: Role) {
  return hasPermission(role, "grades:manage");
}

export function canManageBranding(role: Role) {
  return hasPermission(role, "branding:manage");
}

export function canViewSupport(role: Role) {
  return hasPermission(role, "support:read");
}

export function canManageSupport(role: Role) {
  return hasPermission(role, "support:manage");
}

export function canManageClasses(role: Role) {
  return hasPermission(role, "classes:manage");
}
