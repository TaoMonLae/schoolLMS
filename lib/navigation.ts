import { Role } from "@/lib/types";

// ─── School dashboard navigation ─────────────────────────────────────────────

export type NavItemDef = {
  label: string;
  href: string;
  icon: string;
  /** If set, only these roles see this nav item. Omit to show to all authenticated roles. */
  allowedRoles?: Role[];
};

export const navItems: NavItemDef[] = [
  { label: "Dashboard", href: "/dashboard", icon: "Home" },
  {
    label: "Schools",
    href: "/dashboard/schools",
    icon: "School",
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    label: "Students",
    href: "/dashboard/students",
    icon: "GraduationCap",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "CASE_MANAGER"],
  },
  {
    label: "Refugee Support",
    href: "/dashboard/support",
    icon: "HeartHandshake",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "CASE_MANAGER"],
  },
  {
    label: "Classes",
    href: "/dashboard/classes",
    icon: "BookOpenCheck",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"],
  },
  { label: "LMS", href: "/dashboard/lms", icon: "BookMarked" },
  {
    label: "Assignments",
    href: "/dashboard/assignments",
    icon: "ClipboardList",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
  },
  {
    label: "Exams",
    href: "/dashboard/exams",
    icon: "FileCheck2",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"],
  },
  { label: "Grades", href: "/dashboard/grades", icon: "BarChart3" },
  { label: "E-Library", href: "/dashboard/library", icon: "LibraryBig" },
  { label: "Video Lessons", href: "/dashboard/videos", icon: "PlayCircle" },
  {
    label: "Enrollments",
    href: "/dashboard/enrollments",
    icon: "Users",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: "CalendarCheck",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"],
  },
  {
    label: "Branding",
    href: "/dashboard/settings/branding",
    icon: "Settings",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  },
  {
    label: "Access Control",
    href: "/dashboard/access-control",
    icon: "ShieldCheck",
    allowedRoles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
  },
];

/** Returns only the nav items visible to the given role. */
export function getNavItemsForRole(role: Role): NavItemDef[] {
  return navItems.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role));
}

// ─── Super-admin navigation ───────────────────────────────────────────────────

export const superAdminNavItems: NavItemDef[] = [
  { label: "Overview", href: "/super-admin", icon: "LayoutDashboard" },
  { label: "Schools", href: "/super-admin/schools", icon: "Building2" },
];
