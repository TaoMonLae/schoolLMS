import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='campusbloom-theme';var stored=localStorage.getItem(key);var theme=stored||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;}catch(e){}})();`
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
