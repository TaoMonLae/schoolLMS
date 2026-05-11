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
      className="min-h-screen bg-rice"
      style={{
        "--school-primary": school.primaryColor,
        "--school-secondary": school.secondaryColor
      } as React.CSSProperties}
    >
      <Sidebar school={school} role={currentUser.role} />
      <main className="lg:pl-72">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
