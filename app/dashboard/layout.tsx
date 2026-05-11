export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/sidebar";
import { getSchoolBrandingForUser } from "@/lib/branding";
import { getRequiredCurrentUser } from "@/lib/session";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getRequiredCurrentUser();
  const school = await getSchoolBrandingForUser(currentUser);
  return (
    <div
      className="min-h-screen bg-surface"
      style={{
        "--school-primary": school.primaryColor,
        "--school-secondary": school.secondaryColor
      } as React.CSSProperties}
    >
      <Sidebar school={school} role={currentUser.role} />
      <main className="lg:pl-72">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-md py-md sm:px-xl lg:px-xxl">
          {children}
        </div>
      </main>
    </div>
  );
}
