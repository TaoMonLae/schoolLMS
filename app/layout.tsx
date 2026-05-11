import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Refugee SchoolOS",
  description: "A multi-tenant LMS foundation for refugee learning centres."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
