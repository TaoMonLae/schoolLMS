import { Sidebar } from "@/components/sidebar";
import { demoSchoolBranding } from "@/lib/branding";

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-screen bg-rice"
      style={{
        "--school-primary": demoSchoolBranding.primaryColor,
        "--school-secondary": demoSchoolBranding.secondaryColor
      } as React.CSSProperties}
    >
      <Sidebar />
      <main className="lg:pl-72">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
