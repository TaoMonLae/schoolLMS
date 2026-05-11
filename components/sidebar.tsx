"use client";

import React from "react";
import { BarChart3, BookMarked, BookOpenCheck, CalendarCheck, ClipboardList, FileCheck2, GraduationCap, HeartHandshake, Home, LibraryBig, LogOut, Menu, PlayCircle, School, Settings, ShieldCheck, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/logout/actions";
import { getDisplaySchoolName } from "@/lib/branding";
import { getNavItemsForRole } from "@/lib/navigation";
import { Role, SchoolSummary } from "@/lib/types";

const icons: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>> = {
  Home,
  School,
  GraduationCap,
  HeartHandshake,
  BookOpenCheck,
  BookMarked,
  ClipboardList,
  FileCheck2,
  BarChart3,
  LibraryBig,
  PlayCircle,
  Users,
  CalendarCheck,
  Settings,
  ShieldCheck
};

export function Sidebar({ school, role }: { school: SchoolSummary; role: Role }) {
  const [open, setOpen] = useState(false);
  const schoolName = getDisplaySchoolName(school);
  // Role-filtered navigation — only show items the current user's role can access
  const visibleNavItems = getNavItemsForRole(role);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="text-base font-semibold text-ink">
          {schoolName}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink"
          aria-label={open ? "Close navigation" : "Open navigation"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-line bg-white px-4 py-5 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 px-2" onClick={() => setOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
              <School className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{schoolName}</p>
              <p className="text-xs text-moss">Multi-tenant LMS</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = icons[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-rice hover:text-ink"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-lg border border-line bg-rice p-4">
              <p className="text-sm font-semibold text-ink">{school.name}</p>
              <p className="mt-1 text-xs leading-5 text-moss">Tenant scope active through school_id.</p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md border border-line px-3 py-2 text-sm font-medium text-moss hover:bg-rice hover:text-ink"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {open ? <button className="fixed inset-0 z-30 bg-ink/30 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
